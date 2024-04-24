import { CombinedUserData } from "@/lib/types";
import { getCombinedUserDataById } from "@/lib/userActions";
import { useEffect, useState } from "react";

interface UserInfoProps {
  userId: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ userId }) => {
  const [userData, setUserData] = useState<CombinedUserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await getCombinedUserDataById(userId);
      console.log("response", response);
      const data: CombinedUserData =
        response?.data && response.data ? response.data : null;
      if (!data) {
        return;
      }
      setUserData(data);
    };

    fetchUserData();
  }, [userId]);

  if (!userData) {
    return <div className="text-light">Loading...</div>;
  }

  return (
    <div className="overflow-hidden bg-charleston shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-light">User Information</h3>
        <p className="mt-1 max-w-2xl text-sm text-light">
          Detailed information about the selected user.
        </p>
      </div>
      <div
        className="overflow-auto border-t border-[#525252] sm:h-auto"
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

            // Format gender value
            if (key === "gender") {
              formattedValue = value === "F" ? "Female" : value === "M" ? "Male" : value;
            }

            // Format date of birth
            if (key === "dateofbirth") {
              formattedValue = new Date(formattedValue).toLocaleDateString("en-US", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
              });
            }

            return (
              <div
                key={key}
                className="bg-raisinblack px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
              >
                <dt className="text-sm font-medium text-gray-500">{formattedKey}</dt>
                <dd className="mt-1 text-sm text-light sm:col-span-2 sm:mt-0">
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
