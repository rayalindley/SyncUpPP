import Link from "next/link";

interface Certificate {
  certificate_id: string;
  events: {
    title: string;
    starteventdatetime: string;
  };
}

interface UserCertificatesProps {
  certificates: Certificate[];
}

export default function UserCertificates({ certificates }: UserCertificatesProps) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Your Certificates</h2>
      {certificates && certificates.length > 0 ? (
        <ul className="space-y-4">
          {certificates.map((certificate) => (
            <li key={certificate.certificate_id} className="p-4 bg-charleston rounded-md">
              <p>Event: {certificate.events.title}</p>
              <p>Date: {new Date(certificate.events.starteventdatetime).toDateString()}</p>
              <Link href={`/api/certificates/${certificate.certificate_id}`} target="_blank">
                <a className="text-primary hover:underline">View Certificate</a>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have no certificates yet.</p>
      )}
    </div>
  );
}
