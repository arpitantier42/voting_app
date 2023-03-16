import { Typography } from "@material-tailwind/react";
import VoteCreationForm, { VoteCreationFormProps } from "./VoteCreationForm";

function VoteCreationPage() {
  const handleSubmit: VoteCreationFormProps["onSubmit"] = (data) => {
    console.log("form submit", data);
  };

  return (
    <>
      <Typography variant="h3">New Voting Round</Typography>

      <div className="w-full max-w-sm">
        <VoteCreationForm onSubmit={(data) => handleSubmit(data)} />
        <div className="md:flex md:items-center mb-6">
          <div className="w-full px-3">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="snapshot">
              Snapshot file (optional)
            </label>
            <input
              className="block w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100"
              id="snapshot"
              type="file"
            />
          </div>
        </div>
        <div className="md:flex md:items-center mb-6">
          <div className="w-full px-3">
            <label className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2" htmlFor="quorom">
              Minimum number of votes (Quorum) (Optional)
            </label>
            <input
              className="appearance-none block w-full bg-gray-100 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
              id="quorom"
              type="text"
            />
          </div>
        </div>
        <div className="md:flex md:items-center">
          <div className="md:w-1/3"></div>
          <div className="md:w-2/3">
            <button
              className="shadow bg-algorand-arctic-lime hover:bg-algorand-orange-coral focus:shadow-outline focus:outline-none hover:text-white font-bold py-2 px-4 rounded-full"
              type="button"
            >
              Next Step
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default VoteCreationPage;
