import SignaturePad from "react-signature-canvas";
import { useRef } from "react";
import * as htmlToImage from "html-to-image";
import { insertEvent, updateEvent } from "@/lib/events";
import { getUser, createClient } from "@/lib/supabase/client";
import { PhotoIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import Tagify from "@yaireo/tagify";
import TagsInput from "./custom/tags-input";

import "@yaireo/tagify/dist/tagify.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import "../app/tags.css";
import { recordActivity } from "@/lib/track";

const isFutureDate = (value: Date) => {
  if (value instanceof Date) {
    const now = new Date();
    return value > now;
  }
  return false;
};

const isValidEventPeriod = (start: Date, end: Date) => {
  return start < end;
};

const EventSchema = z
  .object({
    title: z.string().min(3, "Event Title is required"),
    description: z.string().min(3, "Description is required"),
    starteventdatetime: z.date().refine((value) => isFutureDate(value), {
      message: "Start Event Date & Time should be in the future",
    }),
    endeventdatetime: z.date(),
    location: z.string().min(3, "Location is required"),
    capacity: z
      .number()
      .int()
      .min(1, "Capacity must be at least 1")
      .refine((value) => value !== 0, "Capacity cannot be zero")
      .optional()
      .nullable(),
    registrationfee: z
      .number()
      .nonnegative("Registration Fee cannot be negative")
      .optional()
      .nullable(),
    onsite: z.boolean().optional().nullable(),
    certificate_enabled: z.boolean().optional(),
    signatories: z
      .array(
        z.object({
          name: z.string().min(1, "Name is required"),
          signature: z.string().nullable(),
          position: z.string().min(1, "Position is required"),
        })
      )
      .optional(),
    release_option: z.enum(["disabled", "after_event", "scheduled"]).optional(),
    scheduled_release_date: z.date().optional().nullable(),
    certificate_background: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.release_option === "scheduled" && data.scheduled_release_date) {
        return data.scheduled_release_date > new Date();
      }
      return true;
    },
    {
      message: "Scheduled release date must be in the future.",
      path: ["scheduled_release_date"],
    }
  );

export interface EventFormValues {
  eventid?: string;
  title: string;
  description: string;
  starteventdatetime: Date;
  endeventdatetime: Date;
  location: string;
  capacity?: number | null;
  registrationfee?: number | null;
  privacy: any;
  organizationid: string;
  eventphoto: string | null;
  tags: string[];
  eventslug?: string;
  onsite?: boolean | null;
  certificate_enabled?: boolean;
  release_option?: "disabled" | "after_event" | "scheduled";
  scheduled_release_date?: Date | null;
  signatories?: {
    name: string;
    signature: string | null;
    position: string;
  }[];
  certificate_background?: string | null;
}

type TagData = {
  value: string;
  [key: string]: any;
};
const CreateEventForm = ({
  organizationid,
  event,
}: {
  organizationid: string;
  event?: EventFormValues;
}) => {
  const certificateInputRef = useRef<HTMLInputElement>(null);

  const [certificateBackgroundFile, setCertificateBackgroundFile] = useState<File | null>(
    null
  );
  const [certificateBackground, setCertificateBackground] = useState<string | null>(
    event?.certificate_background || null
  );

  type Signatory = {
    name: string;
    position: string;
    signature: string | null;
  };

  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const signaturePadRefs = useRef<SignaturePad[]>([]);

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
  const [imageError, setImageError] = useState("");

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedMemberships, setSelectedMemberships] = useState<string[]>([]);
  const [privacyType, setPrivacyType] = useState<string>(event?.privacy.type || "public");

  const [roleSuggestions, setRoleSuggestions] = useState<string[]>([]);
  const [membershipSuggestions, setMembershipSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true); // Loading state for suggestions
  const [privacyValue, setPrivacyValue] = useState<string>(event?.privacy || "public");

  const [allowAllRoles, setAllowAllRoles] = useState<boolean>(
    event?.privacy.allow_all_roles || false
  );
  const [allowAllMemberships, setAllowAllMemberships] = useState<boolean>(
    event?.privacy.allow_all_memberships || false
  );

  const [onsitePayment, setOnsitePayment] = useState<boolean | null>(
    event?.onsite || false
  );

  const router = useRouter();

  const formOptions = event ? { defaultValues: event } : {};
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<EventFormValues>({
    resolver: zodResolver(EventSchema),
    mode: "onChange",
    ...formOptions,
  });

  function generateRandomSlug(length = 8) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  async function checkSlugAvailability(slug: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("events")
      .select("eventslug")
      .eq("eventslug", slug)
      .maybeSingle();

    if (error) {
      console.error("Error fetching slug:", error);
      return {
        isAvailable: false,
        error: error.message,
      };
    }

    return {
      isAvailable: !data,
      error: null,
    };
  }

  useEffect(() => {
    if (organizationid) {
      const fetchRolesAndMemberships = async () => {
        const supabase = createClient();
        try {
          // Fetch roles
          const { data: rolesData } = await supabase
            .from("organization_roles")
            .select("role")
            .eq("org_id", organizationid);

          // Fetch membership tiers
          const { data: membershipsData } = await supabase
            .from("organization_memberships")
            .select("name")
            .eq("organizationid", organizationid);

          const fetchedRoleSuggestions = [
            "All Roles",
            ...(rolesData?.map((role) => role.role) || []),
          ];
          const fetchedMembershipSuggestions = [
            "All Membership Tiers",
            ...(membershipsData?.map((membership) => membership.name) || []),
          ];

          // console.log("Fetched Role Suggestions:", fetchedRoleSuggestions);
          // console.log("Fetched Membership Suggestions:", fetchedMembershipSuggestions);

          setRoleSuggestions(fetchedRoleSuggestions);
          setMembershipSuggestions(fetchedMembershipSuggestions);
          setLoadingSuggestions(false); // Set loading to false after fetching
        } catch (error) {
          toast.error("Error fetching roles or memberships. Please try again.");
          setLoadingSuggestions(false);
        }
      };
      fetchRolesAndMemberships();
    }
  }, [organizationid]);

  // Handle event data when editing
  useEffect(() => {
    if (event) {
      // Populate the roles and memberships when editing an event
      setSelectedRoles(event.privacy?.roles || []);
      setSelectedMemberships(event.privacy?.membership_tiers || []);
      setPrivacyType(event.privacy?.type || "public"); // Default to "public" if not set
      setAllowAllRoles(event.privacy?.allow_all_roles || false);
      setAllowAllMemberships(event.privacy?.allow_all_memberships || false);

      (["starteventdatetime", "endeventdatetime"] as (keyof EventFormValues)[]).forEach(
        (key) => {
          const formattedDate = formatDateForInput(new Date(event[key] as string));
          setValue(key, formattedDate);
          // console.log("Formatted Date:", formattedDate);
        }
      );

      (["scheduled_release_date"] as (keyof EventFormValues)[]).forEach((key) => {
        if (event[key]) {
          const date = new Date(event[key] as string);
          const formattedDate = formatDateForInput(date);
          setValue(key, formattedDate);
          // console.log("Formatted Date 2:", formattedDate);
        }
      });

      // console.log("Event Data:", event);

      setValue("title", event.title);
      setValue("description", event.description);
      setValue("location", event.location);
      setValue("capacity", event.capacity);
      setValue("registrationfee", event.registrationfee);
      setValue("onsite", event.onsite);
      setValue("tags", event.tags);

      setValue("certificate_enabled", event.certificate_enabled);
      setValue("release_option", event.release_option);

      setOnsitePayment(event.onsite || false);

      setPreviousPhotoUrl(event.eventphoto || null);
      setEventPhoto(
        event.eventphoto
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${event.eventphoto}`
          : null
      );

      // Set certificate background state
      setCertificateBackground(
        event.certificate_background
          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${event.certificate_background}`
          : null
      );

      const fetchSignatories = async () => {
        const supabase = createClient();
        const { data: signatoriesData, error } = await supabase
          .from("event_signatories")
          .select("*")
          .eq("event_id", event.eventid)
          .limit(3);
        if (error) {
          console.error("Error fetching signatories:", error);
          toast.error("Error fetching signatories.");
        } else {
          const formattedSignatories = signatoriesData.map((signatory) => ({
            name: signatory.name,
            position: signatory.position, // Add the position property
            signature: signatory.signature
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${signatory.signature}`
              : null,
          }));
          setSignatories(formattedSignatories);
          setValue("signatories", formattedSignatories);
          // console.log("Formatted Signatories:", formattedSignatories);

          formattedSignatories.forEach((signatory, index) => {
            const signaturePad = signaturePadRefs.current[index];
            if (signaturePad && signatory.signature) {
              fetch(signatory.signature)
                .then((res) => {
                  if (!res.ok) {
                    throw new Error(`Failed to fetch signature for ${signatory.name}`);
                  }
                  return res.blob();
                })
                .then((blob) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(blob);
                  reader.onloadend = () => {
                    const dataUrl = reader.result as string;
                    signaturePad.fromDataURL(dataUrl);
                  };
                })
                .catch((err) => {
                  console.error(`Error loading signature for ${signatory.name}:`, err);
                });
            }
          });
        }
      };
      fetchSignatories();
    }
  }, [event, setValue]);

  useEffect(() => {
    setValue("signatories", signatories);
    trigger();
  }, [signatories, setValue, trigger]);

  useEffect(() => {
    setValue("signatories", signatories);
    trigger();
  }, [signatories, setValue, trigger]);

  const onSubmit: SubmitHandler<EventFormValues> = async (formData) => {
    setIsLoading(true);
    try {
      if (
        privacyType === "private" &&
        selectedRoles.length === 0 &&
        selectedMemberships.length === 0
      ) {
        toast.error(
          "Please select at least one role or membership tier for private events."
        );
        return;
      }

      const finalCapacityValue = capacityValue;
      const finalRegistrationFeeValue = registrationFeeValue;

      const privacySettings = {
        type: privacyType,
        roles: allowAllRoles ? [] : selectedRoles,
        membership_tiers: allowAllMemberships ? [] : selectedMemberships,
        allow_all_roles: allowAllRoles,
        allow_all_memberships: allowAllMemberships,
      };

      const supabase = createClient();

      let imageUrl = event?.eventphoto || null;
      if (photoFile) {
        if (previousPhotoUrl && previousPhotoUrl !== event?.eventphoto) {
          const { error: deleteError } = await supabase.storage
            .from("event-images")
            .remove([previousPhotoUrl]);
          if (deleteError) {
            console.error("Error removing previous image:", deleteError);
            toast.error("Error removing previous image. Please try again.");
            return;
          }
        }
        const fileName = `${formData.title}_${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}`;
        const { data: uploadResult, error: uploadError } = await supabase.storage
          .from("event-images")
          .upload(fileName, photoFile, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadResult) {
          imageUrl = `event-images/${uploadResult.path}`;
          setPreviousPhotoUrl(imageUrl);
        } else {
          console.error("Error uploading image:", uploadError);
          toast.error("Error uploading image. Please try again.");
          return;
        }
      } else if (removeImageFlag && previousPhotoUrl) {
        const fileName = previousPhotoUrl?.split("/").pop() ?? "";

        const { error } = await supabase.storage.from("event-images").remove([fileName]);
        if (error) {
          console.error("Error removing image:", error);
          toast.error("Error removing image. Please try again.");
          return;
        }
        imageUrl = null;
        setPreviousPhotoUrl(null);
      }

      const startEventDateTimeWithTimezone = new Date(
        formData.starteventdatetime
      ).toISOString();
      const endEventDateTimeWithTimezone = new Date(
        formData.endeventdatetime
      ).toISOString();
      const formattedTags = `{${tags.map((tag) => `"${tag}"`).join(",")}}`;

      let slug;
      if (!event) {
        slug = generateRandomSlug();
        let slugCheck = await checkSlugAvailability(slug);

        while (!slugCheck.isAvailable) {
          slug = generateRandomSlug();
          slugCheck = await checkSlugAvailability(slug);
        }

        if (slugCheck.error) {
          toast.error("Error checking slug availability. Please try again.");
          return;
        }
      }

      const signatoriesData = [];
    const basePublicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;

    for (let i = 0; i < signatories.length; i++) {
      const signatory = signatories[i];
      const signatureData = signatory.signature;

      if (signatureData) {
        if (signatureData.startsWith("data:")) {
          // Upload the signature and store the path
          const response = await fetch(signatureData);
          const blob = await response.blob();
          const secureFileName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 15)}.png`;
          const fileName = `signatures/${secureFileName}`;
          const { data: uploadResult, error: uploadError } = await supabase.storage
            .from("signatures")
            .upload(fileName, blob);

          if (uploadResult) {
            const signaturePath = `signatures/${uploadResult.path}`;
            signatoriesData.push({
              name: signatory.name,
              signature: signaturePath,
              position: signatory.position,
            });
          } else {
            console.error("Error uploading signature:", uploadError);
            toast.error("Error uploading signature. Please try again.");
            return;
          }
        } else {
          // If signatureData is a full URL, extract the path
          let signaturePath = signatureData;
          if (signatureData.startsWith(basePublicUrl)) {
            signaturePath = signatureData.replace(basePublicUrl, "");
          }
          signatoriesData.push({
            name: signatory.name,
            signature: signaturePath,
            position: signatory.position,
          });
        }
      } else {
        toast.error(
          `Signature for ${signatory.name} is empty. Please provide a signature.`
        );
        return;
      }
      }

      // Handle certificate background upload/removal
      let certificateBackgroundUrl = event?.certificate_background || null;
      if (certificateBackgroundFile) {
        const fileName = `certificate_background_${formData.title}_${Date.now()}-${Math.random()
          .toString(36)
          .substring(7)}.png`;
        const { data: uploadResult, error: uploadError } = await supabase.storage
          .from("certificate-backgrounds")
          .upload(fileName, certificateBackgroundFile, {
            cacheControl: "3600",
            upsert: false,
          });
        if (uploadResult) {
          certificateBackgroundUrl = `certificate-backgrounds/${uploadResult.path}`;
        } else {
          console.error("Error uploading certificate background:", uploadError);
          toast.error("Error uploading certificate background.");
          return;
        }
      } else if (removeImageFlag && event?.certificate_background) {
        const fileName = event.certificate_background.split("/").pop() ?? "";
        const { error } = await supabase.storage
          .from("certificate-backgrounds")
          .remove([fileName]);
        if (error) {
          console.error("Error removing certificate background:", error);
          toast.error("Error removing certificate background. Please try again.");
          return;
        }
        certificateBackgroundUrl = null;
      }

      const completeFormData = {
        ...formData,
        eventphoto: imageUrl,
        starteventdatetime: startEventDateTimeWithTimezone,
        endeventdatetime: endEventDateTimeWithTimezone,
        capacity: finalCapacityValue,
        registrationfee: finalRegistrationFeeValue,
        tags: formattedTags,
        slug: event ? event.eventslug : slug,
        privacy: privacySettings,
        onsite: onsitePayment,
        certificate_enabled: certificateEnabled,
        release_option: formData.release_option || "disabled",
        scheduled_release_date: formData.scheduled_release_date
          ? formData.scheduled_release_date.toISOString()
          : null,
        signatories: signatoriesData,
        certificate_background: certificateBackgroundUrl || "default-certificate-bg/default-cert-bg.png",
      };

      const { data, error } = event
        ? await updateEvent(event.eventid!, completeFormData)
        : await insertEvent(completeFormData, organizationid);

      if (data) {
        const eventId = event ? event.eventid! : data[0].eventid;

        if (event) {
          const { error: deleteError } = await supabase
            .from("event_signatories")
            .delete()
            .eq("event_id", eventId);
          if (deleteError) {
            console.error("Error deleting existing signatories:", deleteError);
            toast.error("Error updating signatories. Please try again.");
            return;
          }
        }

        for (const signatory of signatoriesData) {
          const { error: signatoryError } = await supabase
            .from("event_signatories")
            .insert({
              event_id: eventId,
              name: signatory.name,
              signature: signatory.signature,
              position: signatory.position,
            });
          if (signatoryError) {
            console.error("Error saving signatory:", signatoryError);
            toast.error("Error saving signatory. Please try again.");
            return;
          }
        }

        if (!event) {
          const { user } = await getUser();
          const userId = user?.id; // Get the current user's ID
          if (userId) {
            await supabase.from("eventregistrations").insert([
              {
                eventid: data[0].eventid, // Use the newly created event ID
                userid: userId,
                status: "registered", // Set the registration status
                attendance: "present", // Set the attendance status
              },
            ]);
          }
        }

        await recordActivity({
          activity_type: event ? "event_update" : "event_create",
          organization_id: organizationid,
          description: `${completeFormData.title} was ${event ? "updated" : "created"}`,
          activity_details: {
            event_title: completeFormData.title,
            event_slug: completeFormData.slug,
            event_description: completeFormData.description,
            event_capacity: completeFormData.capacity,
            event_registration_fee: completeFormData.registrationfee,
            event_starteventdatetime: completeFormData.starteventdatetime,
            event_endeventdatetime: completeFormData.endeventdatetime,
          },
        });

        toast.success(
          event ? "Event was updated successfully." : "Event was created successfully."
        );

        router.push(`/e/${event ? event.eventslug : completeFormData.slug}`);
        reset();
      } else if (error) {
        toast.error(
          error.message ||
            (event
              ? "An error occurred while updating the event"
              : "An error occurred while creating the event")
        );
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      toast.error(
        error.message || "An unexpected error occurred while submitting the form."
      );
    } finally {
      setIsLoading(false);
      setRemoveImageFlag(false);
    }
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const input = document.querySelector("input[name=tags]");
    const tagify = new Tagify(input as HTMLInputElement, {
      originalInputValueFormat: (valuesArr: TagData[]) =>
        valuesArr.map((item) => item.value).join(","), // Change made here
    });

    tagify.on("change", (e) => {
      const tagsArray = e.detail.value.split(",").map((tag) => tag.trim());
      setTags(tagsArray);
    });

    if (event?.tags) {
      setTags(event.tags);
      tagify.addTags(event.tags);
    }

    return () => {
      tagify.destroy();
    };
  }, [event]);

  useEffect(() => {
    if (event && event.eventphoto) {
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${event.eventphoto}`;
      setEventPhoto(imageUrl);
    }
  }, [event]);

  const [enabled, setEnabled] = useState(false);
  const [hasCapacityLimit, setHasCapacityLimit] = useState(
    event?.capacity ? event.capacity > 0 : false
  );
  const [hasRegistrationFee, setHasRegistrationFee] = useState(
    event?.registrationfee ? event.registrationfee > 0 : false
  );

  const handleRegistrationFeeChange = (hasFee: boolean) => {
    setHasRegistrationFee(hasFee);
    if (!hasFee) {
      setRegistrationFeeValue(null);
      setValue("registrationfee", null);
      trigger("registrationfee");
    }
  };

  const handleCapacityChange = (hasLimit: boolean) => {
    setHasCapacityLimit(hasLimit);
    if (!hasLimit) {
      setCapacityValue(null);
      setValue("capacity", null);
      trigger("capacity");
    }
  };

  const now = new Date();
  const currentDateTimeLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const removeImage = () => {
    setEventPhoto(null);
    setPhotoFile(null);
    setRemoveImageFlag(true);
  };

  const [tags, setTags] = useState<string[]>(event?.tags || []);

  const handleRolesChange = (roles: string[]) => {
    if (roles.includes("All Roles")) {
      setAllowAllRoles(true);
      setSelectedRoles(["All Roles"]); // Make sure "All Roles" is added as a tag
    } else {
      setAllowAllRoles(false);
      setSelectedRoles(roles);
    }
  };

  const handleMembershipsChange = (memberships: string[]) => {
    if (memberships.includes("All Membership Tiers")) {
      setAllowAllMemberships(true);
      setSelectedMemberships(["All Membership Tiers"]); // Make sure "All Membership Tiers" is added as a tag
    } else {
      setAllowAllMemberships(false);
      setSelectedMemberships(memberships);
    }
  };

  // Initialize certificate settings state
  const [certificateEnabled, setCertificateEnabled] = useState<boolean>(
    event?.certificate_enabled || false
  );

  // Function to handle certificate_enabled change
  const handleCertificateEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCertificateEnabled(e.target.checked);
    setValue("certificate_enabled", e.target.checked);
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
                  <div className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-3  text-white hover:cursor-pointer hover:bg-gray-600 hover:bg-opacity-25">
                    <PhotoIcon className="h-5 w-5 text-white " />
                    <label
                      htmlFor="file-input"
                      className="cursor-pointer py-2 text-sm font-medium"
                    >
                      Add
                    </label>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith("image/")) {
                            setImageError("Please upload an image file");
                            return;
                          }
                          setImageError("");
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
                    <div className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-3 pr-1 text-white hover:cursor-pointer hover:bg-gray-500 hover:bg-opacity-25">
                      <PhotoIcon className="h-5 w-5 text-white" />
                      <label
                        htmlFor="file-input"
                        className="cursor-pointer py-2 pr-2 text-sm font-medium"
                      >
                        Change
                      </label>
                      <input
                        id="file-input"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith("image/")) {
                              setImageError("Please upload an image file");
                              return;
                            }
                            setImageError("");
                            setPhotoFile(file);
                            setEventPhoto(URL.createObjectURL(file));
                            setRemoveImageFlag(false);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="cursor-pointer rounded-lg bg-red-600 bg-opacity-75 px-2 py-2 text-sm font-medium text-light hover:bg-red-700 hover:bg-opacity-50"
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
          <div className="col-span-6 flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="starteventdatetime"
                className="block text-sm font-medium text-white"
              >
                Start Event Date & Time
              </label>
              <input
                type="datetime-local"
                id="starteventdatetime"
                min={currentDateTimeLocal}
                className={`mt-1 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm ${
                  errors.starteventdatetime ? "border-red-500" : ""
                }`}
                {...register("starteventdatetime", {
                  valueAsDate: true,
                  setValueAs: (value) => new Date(value),
                })}
                defaultValue={
                  event ? formatDateForInput(new Date(event.starteventdatetime)) : ""
                }
              />
              {errors.starteventdatetime && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.starteventdatetime.message}
                </p>
              )}
            </div>

            <div className="min-w-[200px] flex-1">
              <label
                htmlFor="endeventdatetime"
                className="block text-sm font-medium text-white"
              >
                End Event Date & Time
              </label>
              <input
                type="datetime-local"
                id="endeventdatetime"
                className={`mt-1 block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm ${
                  errors.endeventdatetime ? "border-red-500" : ""
                }`}
                {...register("endeventdatetime", {
                  valueAsDate: true,
                  setValueAs: (value) => new Date(value),
                })}
                defaultValue={
                  event ? formatDateForInput(new Date(event.endeventdatetime)) : ""
                }
              />
              {errors.endeventdatetime && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.endeventdatetime.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1 text-light">
            <label htmlFor="location" className="text-sm font-medium text-white">
              Location
            </label>
            <span className="text-xs"> (for virtual events, enter the virtual link)</span>
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
                onChange={() => handleCapacityChange(false)}
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
                onChange={() => handleCapacityChange(true)}
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
                onChange={() => handleRegistrationFeeChange(false)}
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
                onChange={() => handleRegistrationFeeChange(true)}
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
                type="number"
                id="registrationfee"
                defaultValue={0}
                step="0.01"
                {...register("registrationfee", { valueAsNumber: true })}
                onChange={(e) => setRegistrationFeeValue(parseFloat(e.target.value))}
                className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              />
              {errors.registrationfee && (
                <p className="text-sm text-red-500">{errors.registrationfee.message}</p>
              )}
              <div className="flex items-center pt-2">
                <input
                  type="checkbox"
                  id="onsitePayment"
                  {...register("onsite")}
                  checked={onsitePayment || false}
                  onChange={(e) => {
                    setOnsitePayment(e.target.checked);
                    setValue("onsite", e.target.checked);
                  }}
                  className="mr-2 border-gray-300 text-primary focus:ring-primarydark"
                />
                <label htmlFor="onsitePayment" className="text-sm font-medium text-white">
                  Allow Onsite Payment
                </label>
              </div>
            </div>
          )}
          {/* Privacy Section */}
          <div className="space-y-1 text-light">
            <label htmlFor="privacy" className="text-sm font-medium text-white">
              Privacy
            </label>
            <select
              id="privacy"
              value={privacyType}
              onChange={(e) => setPrivacyType(e.target.value)}
              className="block w-full rounded-md bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          {privacyType === "private" && (
            <>
              {/* Roles */}
              <div className="mt-4 space-y-1 text-light">
                <label className="text-sm font-medium text-white">Select Roles</label>
                <TagsInput
                  key={event ? event.eventid : "new-event"} // Force re-render on event change
                  value={selectedRoles}
                  onChange={handleRolesChange}
                  suggestions={roleSuggestions}
                  allowCustomTags={false}
                />
              </div>

              {/* Membership Tiers */}
              <div className="mt-4 space-y-1 text-light">
                <label className="text-sm font-medium text-white">
                  Select Membership Tiers
                </label>
                <TagsInput
                  key={event ? event.eventid : "new-event"} // Force re-render on event change
                  value={selectedMemberships}
                  onChange={handleMembershipsChange}
                  suggestions={membershipSuggestions}
                  allowCustomTags={false}
                />
              </div>
            </>
          )}

          <div className="space-y-1 text-light">
            <input
              type="checkbox"
              id="certificate_enabled"
              {...register("certificate_enabled")}
              checked={certificateEnabled}
              onChange={handleCertificateEnabledChange}
              className="mr-2 border-gray-300 text-primary focus:ring-primarydark"
            />
            <label
              htmlFor="certificate_enabled"
              className="text-sm font-medium text-white"
            >
              Enable Certificates
            </label>
          </div>

          {/* Certificate Settings */}
          {watch("certificate_enabled") && (
            <>
              {watch("certificate_enabled") && (
                <>
                  {/* Updated Certificate Background Upload */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-full max-w-lg">
                        <label className="text-sm font-medium text-white">
                          Certificate Background
                        </label>
                      <div className="relative h-64 w-full overflow-hidden rounded-md border-2 border-primary font-semibold">
                        {certificateBackground ? (
                          <img
                            src={certificateBackground}
                            alt="Certificate Background Preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-300"></div>
                        )}
                        <div className="absolute bottom-0 right-0 mb-2 mr-2 flex items-center gap-1">
                          {/* Hidden File Input */}
                          <input
                            type="file"
                            accept="image/*"
                            ref={certificateInputRef}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (!file.type.startsWith("image/")) {
                                  setImageError("Please upload an image file");
                                  return;
                                }
                                setImageError("");
                                setCertificateBackgroundFile(file);
                                setCertificateBackground(URL.createObjectURL(file));
                              }
                            }}
                            className="hidden"
                          />

                          {/* Add Button */}
                          {!certificateBackground ? (
                            <button
                              type="button"
                              onClick={() => certificateInputRef.current?.click()}
                              className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-3 py-2 text-white hover:cursor-pointer hover:bg-gray-600 hover:bg-opacity-25"
                            >
                              <PhotoIcon className="h-5 w-5 text-white" />
                              <span className="text-sm font-medium">Add</span>
                            </button>
                          ) : (
                            <>
                              {/* Change Button */}
                              <button
                                type="button"
                                onClick={() => certificateInputRef.current?.click()}
                                className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-3 py-2 text-white hover:cursor-pointer hover:bg-gray-500 hover:bg-opacity-25"
                              >
                                <PhotoIcon className="h-5 w-5 text-white" />
                                <span className="text-sm font-medium">Change</span>
                              </button>

                              {/* Remove Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setCertificateBackground(null);
                                  setCertificateBackgroundFile(null);
                                  setRemoveImageFlag(true);
                                }}
                                className="cursor-pointer rounded-lg bg-red-600 bg-opacity-75 px-2 py-2 text-sm font-medium text-light hover:bg-red-700 hover:bg-opacity-50"
                              >
                                Remove
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Release Option */}
                  <div className="space-y-1 text-light">
                    <label
                      htmlFor="release_option"
                      className="text-sm font-medium text-white"
                    >
                      Certificate Release Option
                    </label>
                    <select
                      id="release_option"
                      {...register("release_option")}
                      defaultValue={event?.release_option || "after_event"}
                      className="block w-full rounded-md bg-charleston py-1.5 text-light shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                    >
                      <option value="after_event">After Event</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                  {/* Scheduled Release Date */}
                  {watch("release_option") === "scheduled" && (
                    <div className="space-y-1 text-light">
                      <label
                        htmlFor="scheduled_release_date"
                        className="text-sm font-medium text-white"
                      >
                        Scheduled Release Date
                      </label>
                      <input
                        type="datetime-local"
                        id="scheduled_release_date"
                        {...register("scheduled_release_date", { valueAsDate: true })}
                        className="block w-full rounded-md bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                      />
                      {errors.scheduled_release_date && (
                        <p className="text-sm text-red-500">
                          {errors.scheduled_release_date.message}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Signatories Section */}
              <div className="space-y-1 text-light">
                <label className="text-sm font-medium text-white">Signatories</label>
                <br />
                {signatories.map((signatory, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {/* Name Input */}
                      <input
                        type="text"
                        placeholder="Name"
                        value={signatory.name}
                        onChange={(e) => {
                          const updatedSignatories = [...signatories];
                          updatedSignatories[index].name = e.target.value;
                          setSignatories(updatedSignatories);
                        }}
                        className="block w-1/3 rounded-md border-0 bg-white/5 px-2 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm"
                      />
                      {/* Position Input */}
                      <input
                        type="text"
                        placeholder="Position"
                        value={signatory.position}
                        onChange={(e) => {
                          const updatedSignatories = [...signatories];
                          updatedSignatories[index].position = e.target.value;
                          setSignatories(updatedSignatories);
                        }}
                        className="block w-1/3 rounded-md border-0 bg-white/5 px-2 py-1.5 text-white"
                      />
                      {/* Remove Signatory Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const updatedSignatories = signatories.filter(
                            (_, i) => i !== index
                          );
                          setSignatories(updatedSignatories);
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    {/* Signature Pad */}
                    <div>
                      <div className="rounded border border-primary bg-white p-2">
                        <SignaturePad
                          penColor="black"
                          backgroundColor="rgba(0,0,0,0)"
                          onEnd={() => {
                            const signaturePad = signaturePadRefs.current[index];
                            if (signaturePad) {
                              const dataURL = signaturePad.toDataURL("image/png");
                              const updatedSignatories = [...signatories];
                              updatedSignatories[index].signature = dataURL;
                              setSignatories(updatedSignatories);
                            }
                          }}
                          canvasProps={{
                            className: "signatureCanvas",
                            style: {
                              border: "1px solid #ccc",
                              width: "100%",
                              height: "200px",
                            },
                          }}
                          ref={(ref) => {
                            if (ref) {
                              signaturePadRefs.current[index] = ref;
                            }
                          }}
                        />
                      </div>
                      {/* Clear Signature Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const signaturePad = signaturePadRefs.current[index];
                          if (signaturePad) {
                            signaturePad.clear();
                            const updatedSignatories = [...signatories];
                            updatedSignatories[index].signature = null;
                            setSignatories(updatedSignatories);
                          }
                        }}
                        className="mt-2 rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                      >
                        Clear Signature
                      </button>
                    </div>
                  </div>
                ))}
                {/* Add Signatory Button */}
                <button
                  type="button"
                  onClick={() =>
                    setSignatories([
                      ...signatories,
                      { name: "", signature: null, position: "" },
                    ])
                  }
                  className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primarydark"
                >
                  Add Signatory
                </button>
              </div>
            </>
          )}

          <div className="space-y-1 text-light">
            <label htmlFor="tags" className="text-sm font-medium text-white">
              Tags
            </label>
            <input
              name="tags"
              value={tags.join(",")}
              onChange={(e) =>
                setTags(e.target.value.split(",").map((tag) => tag.trim()))
              }
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-charleston focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
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
