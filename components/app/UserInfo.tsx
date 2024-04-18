import { useEffect, useState } from "react";
import { getCombinedUserDataById } from "@/lib/userActions";
import { CombinedUserData } from "@/lib/types";

interface UserInfoProps {
  userId: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ userId }) => {
  const [userData, setUserData] = useState<CombinedUserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await getCombinedUserDataById(userId);
      console.log(response);
      const data: CombinedUserData =
        response?.data && response.data[0] ? response.data[0] : null;
      if (!data) {
        return;
      }
      setUserData(data);
    };

    fetchUserData();
  }, [userId]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">User Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Detailed information about the selected user.
        </p>
      </div>
      <div
        className="overflow-auto border-t border-gray-200 sm:h-auto"
        style={{ maxHeight: "65vh" }}
      >
        <dl>
          {Object.entries(userData).map(([key, value]) => {
            // Skip the 'id' field
            if (key === "id") {
              return null;
            }

            let formattedKey = key
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            if (key === "dateofbirth") formattedKey = "Date of Birth";
            if (key === "updatedat") formattedKey = "Updated At";

            // Replace null values with an empty string
            let formattedValue = value === null ? "" : value;
            formattedValue =
              typeof formattedValue === "string" &&
              formattedValue.includes("-") &&
              formattedValue.includes(":")
                ? new Date(formattedValue).toLocaleString()
                : formattedValue;

            return (
              <div
                key={key}
                className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt className="text-sm font-medium text-gray-500">{formattedKey}</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <pre className="whitespace-pre-wrap">
                    {typeof formattedValue === "string"
                      ? formattedValue
                      : JSON.stringify(formattedValue, null, 2)}
                  </pre>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
};

export default UserInfo;
