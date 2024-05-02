import { CombinedUserData } from "@/lib/types";
import { getCombinedUserDataById, deleteUser } from "@/lib/userActions";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

interface UserInfoProps {
  userId: string;
}

const UserInfo: React.FC<UserInfoProps> = ({ userId }) => {
  const [userData, setUserData] = useState<CombinedUserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const response = await getCombinedUserDataById(userId);
      const data: CombinedUserData = response?.data ? response.data : null;
      setUserData(data);
      console.log(data);
    };

    fetchUserData();
  }, [userId]);

  const handleEdit = () => {
    window.location.href = `/dashboard/users/edit/${userId}`;
  };  

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      const deleteResponse = await deleteUser(userId);
      if (!deleteResponse.error) {
        Swal.fire(
          'Deleted!',
          'The user has been deleted.',
          'success'
        );
        // Redirect or update the state as needed
      } else {
        Swal.fire(
          'Error!',
          'There was an issue deleting the user.',
          'error'
        );
      }
    }
  };

  if (!userData) {
    return <div className="p-5 text-light">Loading...</div>;
  }
  
  return (
    <div className="relative mt-6 flex-1 flex-wrap overflow-hidden px-4 text-light sm:px-6">
      <table className="table-auto">
        <tbody>
          {Object.entries(userData).map(([key, value]) => {
            if (key === 'id' || key === 'updatedat') return null; // Exclude 'id' and 'updatedat'
            let formattedKey = key.replace(/_/g, ' ').split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            if (key === 'dateofbirth') formattedKey = 'Date of Birth';
            if (key === 'updatedat') formattedKey = 'Updated At';
            let formattedValue = value ?? '';
            formattedValue = typeof formattedValue === 'string' &&
              formattedValue.includes('-') &&
              formattedValue.includes(':')
                ? new Date(formattedValue).toLocaleString()
                : formattedValue.toString(); // Convert formattedValue to string
            return (
              <tr key={key}>
                <td className="p-2 font-bold text-gray-400">{formattedKey}:</td>
                <td className="p-2">{formattedValue}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-5 flex gap-2">
        <button
          className="group flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-light text-white shadow-sm hover:bg-opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={handleEdit}
        >
          Edit
        </button>
        <button
          className="group flex items-center rounded-md bg-rose-500 px-4 py-2 text-sm font-semibold text-light text-white shadow-sm hover:bg-opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
  
};

export default UserInfo;
