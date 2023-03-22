import { Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { useParams } from "react-router-dom";
import api, { useConnectedWallet } from "../../shared/api";
import { getTimezone } from "../../shared/getTimezone";
import { SkeletonArray } from "../../shared/SkeletonArray";
import { VotingRound } from "../../shared/types";
import { getMyVote, getVoteEnded, getVoteStarted } from "../../shared/vote";
import { getIsAllowedToVote, getWalletAddresses } from "../../shared/wallet";
import { LoadingDialog } from "../vote-creation/review/LoadingDialog";
import { VoteResults } from "./VoteResults";
import { VoteSubmission } from "./VoteSubmission";
import { WalletVoteStatus } from "./WalletVoteStatus";

const getVotingStateDescription = (round: VotingRound) => {
  if (getVoteEnded(round)) return "Voting round is closed!";
  if (!getVoteStarted(round)) return "Voting opens soon!";
  return "Voting round is open!";
};

function Vote() {
  const { voteCid } = useParams();
  const { data, loading, refetch } = api.useVotingRound(voteCid!);
  const { loading: submittingVote, execute: submitVote } = api.useSubmitVote(voteCid!);

  const voteStarted = !data ? false : getVoteStarted(data);
  const voteEnded = !data ? false : getVoteEnded(data);
  const walletAddress = useConnectedWallet();
  const allowedToVote = !data ? false : getIsAllowedToVote(walletAddress, getWalletAddresses(data.snapshotFile));
  const alreadyVoted = !data ? true : getMyVote(data, walletAddress);
  const canVote = voteStarted && !voteEnded && allowedToVote && !alreadyVoted;

  const handleSubmitVote = async (selectedOption: string) => {
    if (!selectedOption) return;
    try {
      const result = await submitVote({ selectedOption });
      await refetch(result.openRounds.find((p) => p.id === voteCid));
    } catch (e) {
      // TODO: handle failure
    }
  };
  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          {loading ? <Skeleton className="h-12 w-1/2" variant="text" /> : <Typography variant="h3">{data?.voteTitle}</Typography>}
          {loading ? <Skeleton variant="text" /> : <Typography>{data?.voteDescription}</Typography>}

          <div className="mt-3">
            {loading ? (
              <Skeleton variant="text" className="w-56" />
            ) : (
              <Link href={data?.voteInformationUrl ?? ""}>Learn about the vote and candidates</Link>
            )}
          </div>
          <Typography className="mt-5" variant="h4">
            How to vote
          </Typography>

          {loading || !data ? (
            <Stack spacing={1}>
              <Skeleton variant="text" className="w-1/2" />
              <Skeleton variant="rectangular" className="h-10" />
            </Stack>
          ) : (
            <WalletVoteStatus round={data} />
          )}

          {!loading && voteEnded && (
            <div className="mt-5">
              <Typography variant="h4">Vote results</Typography>
              <Box className="flex h-56 w-56 items-center justify-center border-solid border-black border-y border-x ">
                <div className="text-center">
                  <Typography>Image of NFT with vote results. Link to NFT source</Typography>
                </div>
              </Box>
            </div>
          )}

          <div className="mt-7">
            {loading ? <Skeleton className="h-8 w-1/2" variant="text" /> : <Typography variant="h4">{data?.questionTitle}</Typography>}

            {loading ? <Skeleton variant="text" className="w-1/2" /> : <Typography>{data?.questionDescription}</Typography>}

            <div className="mt-4">
              {loading || !data ? (
                <SkeletonArray className="max-w-xs" count={4} />
              ) : canVote || !voteStarted ? (
                <VoteSubmission round={data} handleSubmitVote={handleSubmitVote} />
              ) : (
                <VoteResults round={data} />
              )}
            </div>
          </div>
        </div>
        <div>
          <Box className="bg-algorand-diamond rounded-xl p-4">
            <div className="text-center">
              {loading || !data ? (
                <Skeleton variant="rectangular" className="h-5 w-3/4 mx-auto" />
              ) : (
                <Typography variant="h5">{getVotingStateDescription(data)}</Typography>
              )}
            </div>
            <Stack className="mt-3">
              <Typography variant="h6">From</Typography>
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  {dayjs(data?.start).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(data?.start))}
                </Typography>
              )}
            </Stack>
            <Stack className="mt-3">
              <Typography variant="h6">To</Typography>
              {loading ? (
                <Skeleton variant="text" />
              ) : (
                <Typography>
                  {dayjs(data?.end).format("D MMMM YYYY HH:mm")} {getTimezone(dayjs(data?.end))}
                </Typography>
              )}
            </Stack>
          </Box>

          <Stack spacing={1}>
            <Typography className="mt-5" variant="h5">
              Vote details
            </Typography>
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <Typography>
                Voting round created by <Link className="font-normal">NF Domain</Link>
              </Typography>
            )}
            {loading ? <Skeleton variant="text" /> : <Link>Smart contract</Link>}
            {loading ? <Skeleton variant="text" /> : <Link>Voting round details in IPFS</Link>}
            {loading ? <Skeleton variant="text" /> : getWalletAddresses(data?.snapshotFile).length ? <Link>Allow list</Link> : null}
          </Stack>
        </div>
      </div>
      <LoadingDialog loading={submittingVote} title="Submitting vote" />
    </div>
  );
}

export default Vote;