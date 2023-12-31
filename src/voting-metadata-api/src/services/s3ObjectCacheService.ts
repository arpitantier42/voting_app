/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { S3 } from '@aws-sdk/client-s3'
import { inject, singleton } from 'tsyringe'
import { IObjectCacheService } from './objectCacheService'

@singleton()
export class S3ObjectCacheService implements IObjectCacheService {
  private s3Client: S3
  private bucket: string

  constructor(@inject('S3Client') s3Client: S3, @inject('S3Bucket') bucket: string) {
    this.s3Client = s3Client
    this.bucket = bucket
  }

  async put<T>(cacheKey: string, data: T): Promise<void> {
    const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}.json` }
    await this.s3Client.putObject({
      ...bucketAndKey,
      Body: JSON.stringify(data, null, 2),
    })
  }

  async putBuffer(cacheKey: string, data: Buffer, mimeType: string): Promise<void> {
    const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}` }
    await this.s3Client.putObject({
      ...bucketAndKey,
      Body: data,
      ContentType: mimeType,
    })
  }

  async getAndCache<T>(
    cacheKey: string,
    generator: (existing: T | undefined) => Promise<T>,
    staleAfterSeconds?: number,
    returnStaleResult?: boolean,
  ): Promise<T> {
    const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}.json` }
    const existingCache = await this.s3Client.getObject(bucketAndKey).catch(() => undefined)
    const expired = staleAfterSeconds && existingCache && (+new Date() - +existingCache.LastModified!) / 1000 > staleAfterSeconds

    const existingJson = existingCache?.Body?.toString() ?? undefined
    const existing = !!existingCache && !!existingJson ? (JSON.parse(existingJson) as T) : undefined

    let value = existing
    if (!existing || expired) {
      console.debug(
        !existingCache
          ? `Cache value '${cacheKey}' empty; getting data for the first time`
          : `Cache value '${cacheKey}' expired: ${existingCache.LastModified!.toISOString()}`,
      )
      try {
        value = await generator(existing)
        if (staleAfterSeconds !== 0) {
          await this.put(cacheKey, value)
          console.log(`Cached value '${cacheKey}.json' written`)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (existingCache && returnStaleResult) {
          console.error(e)
          console.warn(
            `Received error ${e?.message || e} when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`,
          )
        } else {
          throw e
        }
      }
    } else {
      console.debug(`Found cached value '${cacheKey}.json' which is within ${staleAfterSeconds} seconds old so using that`)
    }

    return value!
  }

  async getAndCacheBuffer(
    cacheKey: string,
    generator: (existing: Buffer | undefined) => Promise<[Buffer, string]>,
    mimeType: string | undefined,
    staleAfterSeconds?: number | undefined,
    returnStaleResult?: boolean | undefined,
  ): Promise<[Buffer, string]> {
    const bucketAndKey = { Bucket: this.bucket, Key: `${cacheKey}` }
    const existingCache = await this.s3Client.getObject(bucketAndKey).catch(() => undefined)
    const expired = staleAfterSeconds && existingCache && (+new Date() - +existingCache.LastModified!) / 1000 > staleAfterSeconds

    if (mimeType === undefined) {
      mimeType = existingCache?.ContentType ?? 'application/octet-stream'
    }
    const existingBody = existingCache?.Body ?? undefined
    const existing = !!existingCache && !!existingBody ? Buffer.from(await existingBody.transformToByteArray()) : undefined
    let value = existing
    if (!existing || expired) {
      console.debug(
        !existingCache
          ? `Cache value '${cacheKey}' empty; getting data for the first time`
          : `Cache value '${cacheKey}' expired: ${existingCache.LastModified!.toISOString()}`,
      )
      try {
        const [genValue, type] = await generator(existing)
        value = genValue
        mimeType = type
        if (staleAfterSeconds !== 0) {
          await this.putBuffer(cacheKey, value, type)
          console.log(`Cached value '${cacheKey}' written`)
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        if (existingCache && returnStaleResult) {
          console.error(e)
          console.warn(
            `Received error ${e?.message || e} when trying to repopulate cache value '${cacheKey}'; failing gracefully and using the cache`,
          )
        } else {
          throw e
        }
      }
    } else {
      console.debug(`Found cached value '${cacheKey}.json' which is within ${staleAfterSeconds} seconds old so using that`)
    }

    return [value!, mimeType]
  }
}
