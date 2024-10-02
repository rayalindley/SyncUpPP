import React from "react";
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Activity {
  id: number;
  user_id: string;
  organization_id: string;
  activity_type: string;
  description: string;
  activity_details: Record<string, any>;
  created_at: string;
}

interface ActivityFeedProps {
  activities: Activity[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  return (
    <ul role="list" className="space-y-6 max-h-96 pr-5 overflow-y-auto">
      {activities.map((activity, index) => (
        <li key={activity.id} className="relative flex gap-x-4">
          <div
            className={classNames(
              index === activities.length - 1 ? 'h-6' : '-bottom-6',
              'absolute left-0 top-0 flex w-6 justify-center'
            )}
          >
            <div className="w-px bg-gray-200" />
          </div>
          <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-charleston">
            {activity.activity_type === 'completed' ? (
              <CheckCircleIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
            ) : (
              <div className="h-1.5 w-1.5 rounded-full bg-gray-100 ring-1 ring-gray-300" />
            )}
          </div>
          <div className="flex-auto py-0.5 text-sm leading-5">
            <span className="text-light"> {activity.description}</span>
          </div>
          <time dateTime={activity.created_at} className="flex-none py-0.5 text-xs leading-5 text-gray-500">
            {formatTimeAgo(activity.created_at)}
          </time>
        </li>
      ))}
    </ul>
  );
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default ActivityFeed;
