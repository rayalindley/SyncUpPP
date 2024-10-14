// File: components/user/user_certificates.tsx

import Link from "next/link";

interface Certificate {
  certificate_id: string;
  events: {
    title: string;
    starteventdatetime: string;
    eventslug?: string;
  };
}

interface UserCertificatesProps {
  certificates: Certificate[];
}

export default function UserCertificates({ certificates }: UserCertificatesProps) {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-light">Your Certificates</h2>
      </div>

      {/* Certificates List */}
      {certificates && certificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <div
              key={certificate.certificate_id}
              className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-charleston"
            >
              <div className="flex-1 p-6 flex flex-col justify-between">
                {/* Certificate Details */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">
                    {new Date(certificate.events.starteventdatetime).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-2 text-xl font-semibold text-light">
                    {certificate.events.title}
                  </p>
                </div>

                {/* View Certificate Button */}
                <div className="mt-4">
                  <Link
                    href={`/api/certificates/${certificate.certificate_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-light bg-primary hover:bg-primarydark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    View Certificate
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* No Certificates Message */
        <p className="text-center text-light">You have no certificates yet.</p>
      )}
    </div>
  );
}
