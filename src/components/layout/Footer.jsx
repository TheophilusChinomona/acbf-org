import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import menusData from '../../data/menus.json';
import settingsData from '../../data/settings.json';
import Image from '../common/Image';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const socialLinks = [
    { name: 'Facebook', icon: FaFacebook, url: settingsData.socialMedia.facebook },
    { name: 'Twitter', icon: FaTwitter, url: settingsData.socialMedia.twitter },
    { name: 'Instagram', icon: FaInstagram, url: settingsData.socialMedia.instagram },
    { name: 'LinkedIn', icon: FaLinkedin, url: settingsData.socialMedia.linkedin },
  ].filter(link => link.url); // Only show social links that have URLs

  return (
    <footer className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="text-center md:text-left relative">
            <Link to="/" className="inline-block mb-4 relative">
              <Image
                src={settingsData.logo}
                alt={settingsData.siteName}
                className="h-36 w-auto mx-auto md:mx-0"
                lazy={false}
              />
            </Link>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {menusData.main.map((item) => (
                <li key={item.url}>
                  <Link
                    to={item.url}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              {menusData.footer.map((item) => (
                <li key={item.url}>
                  <Link
                    to={item.url}
                    className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="text-lg font-bold mb-4">Connect</h3>
            <div className="space-y-4">
              {/* Social Media Links */}
              {socialLinks.length > 0 && (
                <div className="flex space-x-4">
                  {socialLinks.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-300 hover:text-white transition-colors duration-200"
                        aria-label={social.name}
                      >
                        <Icon className="w-6 h-6" />
                      </a>
                    );
                  })}
                </div>
              )}
              <div className="text-gray-300 text-sm space-y-1">
                <p>Email: info@acbf.org.za</p>
                <p>Phone: +27 76 775 0044</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 mt-8 pt-8 text-center">
          <p className="text-gray-300 text-sm">
            &copy; {currentYear} Theophilus Chinomona. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

