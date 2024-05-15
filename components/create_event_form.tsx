import { insertEvent, updateEvent } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { PhotoIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";

const isFutureDate = (value: Date, context) => {
  if (value instanceof Date) {
    const now = new Date();
    return value > now || context?.options?.original_value?.getTime() === value.getTime();
  }
  return false;
};

const EventSchema = z.object({
  title: z.string().min(3, "Event Title is required"),
  description: z.string().min(3, "Description is required"),
  eventdatetime: z.date().refine((value, context) => isFutureDate(value, context), {
    message: "Event Date & Time should be in the future",
  }),
  location: z.string().min(3, "Location is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").optional().nullable(),
  registrationfee: z
    .number()
    .min(0, "Registration Fee cannot be negative")
    .optional()
    .nullable(),
  privacy: z.enum(["public", "private"]),
});

interface EventFormValues {
  title: string;
  description: string;
  eventdatetime: Date;
  location: string;
  capacity: number;
  registrationfee: number;
  privacy: "public" | "private";
  organizationId: string;
  eventphoto: string | null;
}

const CreateEventForm = ({
  organizationId,
  event,
}: {
  organizationId: string;
  event?: EventFormValues;
}) => {
  const [eventphoto, setEventPhoto] = useState<string | null>(event?.eventphoto || null);
  const [previousPhotoUrl, setPreviousPhotoUrl] = useState<string | null>(
    event?.eventphoto || null
  );
  const [capacityValue, setCapacityValue] = useState<number | null>(
    event?.capacity || null
  );
  const [registrationFeeValue, setRegistrationFeeValue] = useState<number | null>(
    event?.registrationfee || null
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeImageFlag, setRemoveImageFlag] = useState(false);
  const router = useRouter();

  const formOptions = event ? { defaultValues: event } : {};
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<EventFormValues>({
    resolver: zodResolver(EventSchema),
    mode: "onChange",
    ...formOptions,
  });

  const onSubmit: SubmitHandler<EventFormValues> = async (formData) => {
    setIsLoading(true);

    const finalCapacityValue = capacityValue;
    const finalRegistrationFeeValue = registrationFeeValue;

    const supabase = createClient();

    let imageUrl = event?.eventphoto || null;
    if (photoFile) {
      // Delete the previous image if it exists and is different from the current event image
      if (previousPhotoUrl && previousPhotoUrl !== event?.eventphoto) {
        const { error: deleteError } = await supabase.storage
          .from("event-images")
          .remove([previousPhotoUrl]);
        if (deleteError) {
          console.error("Error removing previous image:", deleteError);
          toast.error("Error removing previous image. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      // Upload the new image
      const fileName = `${formData.title}_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from("event-images")
        .upload(fileName, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult) {
        imageUrl = uploadResult.fullPath;
        setPreviousPhotoUrl(imageUrl); // Update the previousPhotoUrl with the new image URL
      } else {
        console.error("Error uploading image:", uploadError);
        toast.error("Error uploading image. Please try again.");
        setIsLoading(false);
        return;
      }
    } else if (removeImageFlag && previousPhotoUrl) {
      const fileName = previousPhotoUrl.split("/").pop(); // This will get you "test_1715006261622-hip4l"

      // Remove the image from storage
      const { error } = await supabase.storage.from("event-images").remove([fileName]);
      if (error) {
        console.error("Error removing image:", error);
        toast.error("Error removing image. Please try again.");
        setIsLoading(false);
        return;
      }
      imageUrl = null;
      setPreviousPhotoUrl(null); // Reset the previousPhotoUrl since the image was removed
      console.log(fileName);
    }

    const eventDateTimeWithTimezone = new Date(formData.eventdatetime).toISOString();

    const completeFormData = {
      ...formData,
      eventphoto: imageUrl,
      eventdatetime: eventDateTimeWithTimezone,
      capacity: finalCapacityValue,
      registrationfee: finalRegistrationFeeValue,
    };

    const { data, error } = event
      ? await updateEvent(event.eventid, completeFormData)
      : await insertEvent(completeFormData, organizationId);

    if (data) {
      toast.success(
        event ? "Event was updated successfully." : "Event was created successfully."
      );
      router.push("/dashboard/events");
      reset();
    } else if (error) {
      toast.error(
        error.message ||
          (event
            ? "An error occurred while updating the event"
            : "An error occurred while creating the event")
      );
    }

    setIsLoading(false);
    setRemoveImageFlag(false); // Reset the flag after form submission
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (event) {
      Object.keys(event).forEach((key) => {
        if (key === "eventdatetime") {
          const formattedDate = formatDateForInput(new Date(event[key]));
          setValue(key as keyof EventFormValues, formattedDate);
        } else {
          setValue(key as keyof EventFormValues, event[key]);
        }
      });
      setPreviousPhotoUrl(event.eventphoto || null);
    }
  }, [event, setValue]);

  useEffect(() => {
    if (event && event.eventphoto) {
      const imageUrl = `https://wnvzuxgxaygkrqzvwjjd.supabase.co/storage/v1/object/public/${event.eventphoto}`;
      setEventPhoto(imageUrl);
    }
  }, [event]);

  const [enabled, setEnabled] = useState(false);
  const [hasCapacityLimit, setHasCapacityLimit] = useState(
    event?.capacity > 0 || event?.capacity != null
  );
  const [hasRegistrationFee, setHasRegistrationFee] = useState(
    event?.registrationfee > 0 || event?.registrationfee != null
  );

  const now = new Date();
  const currentDateTimeLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const removeImage = () => {
    setEventPhoto(null);
    setPhotoFile(null);
    setRemoveImageFlag(true);
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <div className="relative h-64 w-full overflow-hidden rounded-md border-2 border-primary font-semibold">
              {eventphoto ? (
                <img
                  src={eventphoto}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-charleston"></div>
              )}
              <div className="absolute bottom-0 right-0 mb-2 mr-2 flex items-center gap-1 ">
                {!eventphoto && (
                  <div className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-4  text-white hover:bg-gray-600 hover:bg-opacity-25">
                    <PhotoIcon className="h-6 w-6 text-white" />
                    <label htmlFor="file-input" className="cursor-pointer py-2 ">
                      Add
                    </label>
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          setEventPhoto(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}
                {eventphoto && (
                  <>
                    <div className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-2 pr-1 text-white hover:bg-gray-500 hover:bg-opacity-25">
                      <PhotoIcon className="h-6 w-6 text-white" />
                      <label htmlFor="file-input" className="cursor-pointer py-2 pr-2">
                        Change
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setPhotoFile(file);
                            setEventPhoto(URL.createObjectURL(file));
                            setRemoveImageFlag(false); // Reset the flag when a new image is added
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="cursor-pointer rounded-lg bg-red-600 bg-opacity-50 px-2 py-2 text-light hover:bg-red-700 hover:bg-opacity-25"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          <div className="space-y-1 text-light">
            <label htmlFor="title" className="text-sm font-medium text-white">
              Event Title
            </label>
            <input
              type="text"
              id="title"
              {...register("title")}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>
          <div className="space-y-1 text-light">
            <label htmlFor="description" className="text-sm font-medium text-white">
              Description
            </label>
            <textarea
              id="description"
              {...register("description")}
              className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>
          <div className="space-y-1 text-light">
            <label htmlFor="eventdatetime" className="text-sm font-medium text-white">
              Event Date & Time
            </label>
            <input
              type="datetime-local"
              id="eventdatetime"
              min={currentDateTimeLocal}
              className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
              {...register("eventdatetime", { valueAsDate: true })}
            />
            {errors.eventdatetime && (
              <p className="text-sm text-red-500">{errors.eventdatetime.message}</p>
            )}
          </div>
          <div className="space-y-1 text-light">
            <label htmlFor="location" className="text-sm font-medium text-white">
              Location
            </label>
            <input
              type="text"
              id="location"
              {...register("location")}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            {errors.location && (
              <p className="text-sm text-red-500">{errors.location.message}</p>
            )}
          </div>
          <div className="space-y-1 text-light">
            <label htmlFor="hasCapacityLimit" className="text-sm font-medium text-white">
              Does the event have limited capacity?
            </label>
            <div id="hasCapacityLimit" className="flex items-center">
              <input
                type="radio"
                id="noCapacityLimit"
                value="noCapacityLimit"
                checked={!hasCapacityLimit}
                onChange={() => {
                  setHasCapacityLimit(false);
                  setCapacityValue(null); // Clear capacity value when "No" is selected
                }}
                className="mr-2 border-gray-300 text-primary focus:ring-primarydark"
              />
              <label htmlFor="noCapacityLimit" className="text-sm font-medium text-white">
                No
              </label>
              <input
                type="radio"
                id="yesCapacityLimit"
                value="yesCapacityLimit"
                checked={hasCapacityLimit}
                onChange={() => setHasCapacityLimit(true)}
                className="ml-4 mr-2 border-gray-300 text-primary focus:ring-primarydark"
              />
              <label
                htmlFor="yesCapacityLimit"
                className="text-sm font-medium text-white"
              >
                Yes
              </label>
            </div>
          </div>
          {hasCapacityLimit && (
            <div className="space-y-1 text-light">
              <label htmlFor="capacity" className="text-sm font-medium text-white">
                Capacity
              </label>
              <input
                type="number"
                id="capacity"
                {...register("capacity", { valueAsNumber: true })}
                onChange={(e) => setCapacityValue(parseFloat(e.target.value))}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {errors.capacity && (
                <p className="text-red-500">{errors.capacity.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1 text-light">
            <label
              htmlFor="hasRegistrationFee"
              className="text-sm font-medium text-white"
            >
              Is there a registration fee?
            </label>
            <div id="hasRegistrationFee" className="flex items-center">
              <input
                type="radio"
                id="noFee"
                value="noFee"
                checked={!hasRegistrationFee}
                onChange={() => {
                  setHasRegistrationFee(false);
                  setRegistrationFeeValue(null); // Clear registration fee value when "No" is selected
                }}
                className="mr-2 border-gray-300 text-primary focus:ring-primarydark"
              />
              <label htmlFor="noFee" className="text-sm font-medium text-white">
                No
              </label>
              <input
                type="radio"
                id="yesFee"
                value="yesFee"
                checked={hasRegistrationFee}
                onChange={() => setHasRegistrationFee(true)}
                className="ml-4 mr-2 border-gray-300 text-primary focus:ring-primarydark"
              />
              <label htmlFor="yesFee" className="text-sm font-medium text-white">
                Yes
              </label>
            </div>
          </div>
          {hasRegistrationFee && (
            <div className="space-y-1 text-light">
              <label htmlFor="registrationfee" className="text-sm font-medium text-white">
                Registration Fee
              </label>
              <input
                type="text"
                id="registrationfee"
                defaultValue={0}
                {...register("registrationfee", { valueAsNumber: true })}
                onChange={(e) => setRegistrationFeeValue(parseFloat(e.target.value))}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {errors.registrationfee && (
                <p className="text-sm text-red-500">{errors.registrationfee.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1 text-light">
            <label htmlFor="privacy" className="text-sm font-medium text-white">
              Privacy
            </label>
            <select
              id="privacy"
              {...register("privacy")}
              className="mt-1 block w-full rounded-md border border-[#525252] bg-charleston px-3 py-2 text-white shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
            >
              <option value="" disabled>
                Select privacy
              </option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="flex justify-end rounded-md bg-primary px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primarydark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:bg-charleston"
            >
              {isLoading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateEventForm;
