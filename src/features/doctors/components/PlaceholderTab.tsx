import { Card } from "../../../components/common/Card";

interface PlaceholderTabProps {
  title: string;
  description: string;
}

export const PlaceholderTab = ({ title, description }: PlaceholderTabProps) => {
  return (
    <Card>
      <div className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-500 max-w-md mx-auto">{description}</p>
        <p className="text-sm text-slate-400 mt-4">Coming soon...</p>
      </div>
    </Card>
  );
};
