import { insertEvent, updateEvent } from "@/lib/events"; // Ensure you have an updateEvent function
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
    // Allow the date if it's in the future or if it's the same as the initial value
    return value > now || context?.options?.original_value?.getTime() === value.getTime();
  }
  return false; // Return false if value is not a valid Date object
};

const EventSchema = z.object({
  title: z.string().min(3, "Event Title is required"),
  description: z.string().min(3, "Description is required"),
  eventdatetime: z.date().refine((value, context) => isFutureDate(value, context), {
    message: "Event Date & Time should be in the future",
  }),
  location: z.string().min(3, "Location is required"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").optional(),
  registrationfee: z.number().min(0, "Registration Fee cannot be negative").optional(),
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
  event = null,
}: {
  organizationId: string;
  event?: EventFormValues;
}) => {
  const [eventphoto, setEventPhoto] = useState<string | null>(null);
  const [capacityValue, setCapacityValue] = useState<number | null>(null);
  const [registrationFeeValue, setRegistrationFeeValue] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

    // Use null if the radio buttons are set to "No"
    const finalCapacityValue = hasCapacityLimit ? capacityValue : null;
    const finalRegistrationFeeValue = hasRegistrationFee ? registrationFeeValue : null;

    const supabase = createClient();

    let imageUrl = null;
    if (photoFile) {
      const fileName = `${formData.title}_${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const { data: uploadResult, error } = await supabase.storage
        .from("event-images")
        .upload(fileName, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult) {
        imageUrl = uploadResult.fullPath;
      } else {
        console.error("Error uploading image:", error);
        toast.error("Error uploading image. Please try again.");
        setIsLoading(false);
        return;
      }
    }

    const eventDateTimeWithTimezone = new Date(formData.eventdatetime).toISOString();

    const completeFormData = {
      ...formData,
      eventphoto: imageUrl,
      eventdatetime: eventDateTimeWithTimezone,
      capacity: finalCapacityValue,
      registrationfee: finalRegistrationFeeValue,
    };
    if (!formData.eventdatetime) {
      toast.error("Please select a valid date and time for the event.");
      setIsLoading(false);
      return;
    }

    // console.log(formData.eventdatetime);
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
  };
  useEffect(() => {
    // When the component mounts or the event prop changes, update the form values
    if (event) {
      Object.keys(event).forEach((key) => {
        setValue(key as keyof EventFormValues, event[key]);
      });
    }
  }, [event, setValue]);
  useEffect(() => {
    if (event && event.eventphoto) {
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${event.eventphoto}`;
      setEventPhoto(imageUrl);
    }
  }, [event]);

  const [enabled, setEnabled] = useState(false);
  // const [hasRegistrationFee, setHasRegistrationFee] = useState(false); // State for tracking if there's a registration fee
  // const [hasCapacityLimit, setHasCapacityLimit] = useState(false); // State for tracking if there's a capacity limit
  const [hasCapacityLimit, setHasCapacityLimit] = useState(
    event?.capacity > 0 || event?.capacity != null
  );
  const [hasRegistrationFee, setHasRegistrationFee] = useState(
    event?.registrationfee > 0 || event?.registrationfee != null
  );

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
              <div className="absolute bottom-0 right-0 mb-2 mr-2 grid  grid-cols-2 items-center gap-1 rounded-lg bg-black bg-opacity-25 text-white hover:bg-gray-500 hover:bg-opacity-25">
                <div className="flex justify-end pr-1">
                  <PhotoIcon className="h-6 w-6 text-white" />
                </div>
                <label htmlFor="file-input" className="col-span-1 py-2 pr-2">
                  Add
                </label>
                <input
                  id="file-input"
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setPhotoFile(file);
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      setEventPhoto(previewUrl); // This will update the eventphoto state with the preview URL
                    }
                  }}
                  className="hidden"
                />
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
