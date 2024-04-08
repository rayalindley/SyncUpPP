import { User } from "@supabase/supabase-js";

interface UserInfoProps {
  user: User;
}

const UserInfo: React.FC<UserInfoProps> = ({ user }) => {
  const { user_metadata, app_metadata, ...otherProps } = user;
  const { first_name, last_name, email } = user_metadata;

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">User Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Detailed information about the selected user.
        </p>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{first_name} {last_name}</dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{email}</dd>
          </div>
          {Object.entries(otherProps).map(([key, value]) => (
            <div key={key} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">{key}</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default UserInfo;
