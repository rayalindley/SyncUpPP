import { CiFacebook, CiLinkedin, CiTwitter } from "react-icons/ci";

interface SocialIconsProps {
  facebook: string;
  twitter: string;
  linkedin: string;
}

const SocialIcons = ({ facebook, twitter, linkedin }: SocialIconsProps) => {
  return (
    <div className="my-5">
      {facebook && (
        <a href={facebook} className="mr-4 text-blue-500">
          <CiFacebook className="inline-block h-4 w-4 text-light hover:text-primary sm:h-7 sm:w-7 lg:h-7 lg:w-7" />
        </a>
      )}
      {twitter && (
        <a href={twitter} className="mr-4 text-blue-500">
          <CiTwitter className="inline-block h-4 w-4 text-light hover:text-primary sm:h-7 sm:w-7 lg:h-7 lg:w-7" />
        </a>
      )}
      {linkedin && (
        <a href={linkedin} className="text-blue-500">
          <CiLinkedin className="inline-block h-4 w-4 text-light hover:text-primary sm:h-7 sm:w-7 lg:h-7 lg:w-7" />
        </a>
      )}
    </div>
  );
};

export default SocialIcons;
