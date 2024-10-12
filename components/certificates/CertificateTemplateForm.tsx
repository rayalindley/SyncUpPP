"use client"

import { createCertificateTemplate, updateCertificateTemplate } from "@/lib/certificates";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/user_context";
import { PhotoIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import "@yaireo/tagify/dist/tagify.css";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { z } from "zod";
import { recordActivity } from "@/lib/track";

const CertificateTemplateSchema = z.object({
  template_name: z.string().min(3, "Template Name is required"),
  template_content: z
    .string()
    .min(3, "Template Content is required")
    .refine(
      (value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      },
      {
        message: "Template Content must be valid JSON",
      }
    ),
  automatic_release: z.boolean().optional(),
});

interface CertificateTemplateFormValues {
  template_id?: string;
  template_name: string;
  template_content: string;
  background_url: string | null;
  automatic_release?: boolean;
  organization_id: string;
}

const CertificateTemplateForm = ({
  organization_id,
  template,
}: {
  organization_id: string;
  template?: CertificateTemplateFormValues;
}) => {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    template?.background_url || null
  );
  const [previousBackgroundUrl, setPreviousBackgroundUrl] = useState<string | null>(
    template?.background_url || null
  );
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [removeBackgroundFlag, setRemoveBackgroundFlag] = useState(false);
  const [imageError, setImageError] = useState("");

  const router = useRouter();

  const formOptions = template ? { defaultValues: template } : {};
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    trigger,
    watch,
  } = useForm<CertificateTemplateFormValues>({
    resolver: zodResolver(CertificateTemplateSchema),
    mode: "onChange",
    ...formOptions,
  });

  const onSubmit: SubmitHandler<CertificateTemplateFormValues> = async (formData) => {
    setIsLoading(true);

    const supabase = createClient();

    let imageUrl = template?.background_url || null;
    if (backgroundFile) {
      if (previousBackgroundUrl && previousBackgroundUrl !== template?.background_url) {
        const { error: deleteError } = await supabase.storage
          .from("certificate-backgrounds")
          .remove([previousBackgroundUrl]);
        if (deleteError) {
          console.error("Error removing previous background image:", deleteError);
          toast.error("Error removing previous background image. Please try again.");
          setIsLoading(false);
          return;
        }
      }

      const fileName = `${formData.template_name}_${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const { data: uploadResult, error: uploadError } = await supabase.storage
        .from("certificate-backgrounds")
        .upload(fileName, backgroundFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult) {
        imageUrl = `certificate-backgrounds/${uploadResult.path}`;
        setPreviousBackgroundUrl(imageUrl);
      } else {
        console.error("Error uploading background image:", uploadError);
        toast.error("Error uploading background image. Please try again.");
        setIsLoading(false);
        return;
      }
    } else if (removeBackgroundFlag && previousBackgroundUrl) {
      const fileName = previousBackgroundUrl?.split("/").pop() ?? "";

      const { error } = await supabase.storage
        .from("certificate-backgrounds")
        .remove([fileName]);
      if (error) {
        console.error("Error removing background image:", error);
        toast.error("Error removing background image. Please try again.");
        setIsLoading(false);
        return;
      }
      imageUrl = null;
      setPreviousBackgroundUrl(null);
    }

    const { user } = await useUser();
    const completeFormData = {
      ...formData,
      template_content: JSON.parse(formData.template_content),
      background_url: imageUrl,
      organization_id,
      created_by: user?.id ?? "",
    };

    const { data, error } = template
      ? await updateCertificateTemplate(template.template_id!, completeFormData)
      : await createCertificateTemplate(completeFormData);

    if (data) {
      await recordActivity({
        activity_type: template ? "certificate_template_update" : "certificate_template_create",
        organization_id,
        description: `${completeFormData.template_name} was ${
          template ? "updated" : "created"
        }`,
        activity_details: {
          template_name: completeFormData.template_name,
        },
      });

      toast.success(
        template ? "Template was updated successfully." : "Template was created successfully."
      );

      router.push(`/organization/${organization_id}/dashboard/certificates/templates`);
      reset();
    } else if (error) {
      toast.error(
        error.message ||
          (template
            ? "An error occurred while updating the template"
            : "An error occurred while creating the template")
      );
    }

    setIsLoading(false);
    setRemoveBackgroundFlag(false);
  };

  const removeBackgroundImage = () => {
    setBackgroundImageUrl(null);
    setBackgroundFile(null);
    setRemoveBackgroundFlag(true);
  };

  useEffect(() => {
    if (template && template.background_url) {
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${template.background_url}`;
      setBackgroundImageUrl(imageUrl);
    }
  }, [template]);

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Background Image Upload */}
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <div className="relative h-64 w-full overflow-hidden rounded-md border-2 border-primary font-semibold">
              {backgroundImageUrl ? (
                <img
                  src={backgroundImageUrl}
                  alt="Background Preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-charleston"></div>
              )}
              <div className="absolute bottom-0 right-0 mb-2 mr-2 flex items-center gap-1 ">
                {!backgroundImageUrl && (
                  <div className="flex items-center space-x-2 rounded-lg bg-black bg-opacity-25 px-3 text-white hover:cursor-pointer hover:bg-gray-600 hover:bg-opacity-25">
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
                          setBackgroundFile(file);
                          setBackgroundImageUrl(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                )}
                {backgroundImageUrl && (
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
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (!file.type.startsWith("image/")) {
                              setImageError("Please upload an image file");
                              return;
                            }
                            setImageError("");
                            setBackgroundFile(file);
                            setBackgroundImageUrl(URL.createObjectURL(file));
                            setRemoveBackgroundFlag(false);
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={removeBackgroundImage}
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

        {/* Form Fields */}
        <div className="mt-4 space-y-4">
          {/* Template Name */}
          <div className="space-y-1 text-light">
            <label htmlFor="template_name" className="text-sm font-medium text-white">
              Template Name
            </label>
            <input
              type="text"
              id="template_name"
              {...register("template_name")}
              className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            {errors.template_name && (
              <p className="text-sm text-red-500">{errors.template_name.message}</p>
            )}
          </div>

          {/* Template Content */}
          <div className="space-y-1 text-light">
            <label htmlFor="template_content" className="text-sm font-medium text-white">
              Template Content (JSON)
            </label>
            <textarea
              id="template_content"
              {...register("template_content")}
              className="block max-h-[300px] min-h-[150px] w-full rounded-md border-0 bg-white/5 py-1.5 font-mono text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
            />
            {errors.template_content && (
              <p className="text-sm text-red-500">{errors.template_content.message}</p>
            )}
          </div>

          {/* Automatic Release */}
          <div className="space-y-1 text-light">
            <label htmlFor="automatic_release" className="text-sm font-medium text-white">
              Automatic Release
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="automatic_release"
                {...register("automatic_release")}
                className="mr-2 border-gray-300 text-primary focus:ring-primarydark"
              />
              <label htmlFor="automatic_release" className="text-sm font-medium text-white">
                Enable automatic release of certificates after event completion
              </label>
            </div>
          </div>

          {/* Submit Button */}
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

export default CertificateTemplateForm;
