import { Share2, MessageCircle, Heart, Mail, Phone, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const footerLinks = [
  {
    title: "Company",
    links: [
      { label: "About Us", action: "about" },
      { label: "List Your Property", action: "owner-dashboard" },
      { label: "Careers", action: "careers" },
      { label: "Press", action: "press" }
    ]
  },
  {
    title: "Explore Nepal",
    links: [
      { label: "Destinations", action: "districts" },
      { label: "Culture Guide", action: "culture" },
      { label: "Map Search", action: "listings" },
      { label: "Blog", action: "blog" }
    ]
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", action: "help" },
      { label: "Contact Us", action: "contact" },
      { label: "Safety Guidelines", action: "safety" },
      { label: "Accessibility", action: "accessibility" }
    ]
  }
];

export default function Footer() {
  const navigate = useNavigate();

  const handleLinkClick = (action) => {
    // Navigate to specific pages
    window.scrollTo(0, 0);
    switch(action) {
      case "owner-dashboard":
        navigate("/owner-dashboard");
        break;
      case "districts":
        navigate("/districts");
        break;
      case "listings":
        navigate("/listings");
        break;
      case "about":
      case "careers":
      case "press":
      case "culture":
      case "blog":
      case "help":
      case "contact":
      case "safety":
      case "accessibility":
        // Navigate to home for now, or can be expanded with more routes
        navigate(`/?section=${action}`);
        break;
      default:
        navigate("/");
    }
  };

  const handleSocialClick = (platform) => {
    const socialLinks = {
      facebook: "https://facebook.com/namastestay",
      twitter: "https://twitter.com/namastestay",
      instagram: "https://instagram.com/namastestay",
      email: "mailto:help@namastestay.np"
    };
    
    if (platform === "email") {
      window.location.href = socialLinks.email;
    } else {
      window.open(socialLinks[platform], "_blank");
    }
  };
  return (
    <footer className="bg-linear-to-b from-gray-900 to-black text-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Namaste Stay</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Authentic Nepali hospitality, modern booking precision.
            </p>
            <p className="text-gray-400 text-xs">
              Connecting you to the heart of the Himalayas.
            </p>
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => handleSocialClick("facebook")}
                className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all"
                title="Follow us on Facebook"
              >
                <Share2 size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick("twitter")}
                className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all"
                title="Follow us on Twitter"
              >
                <MessageCircle size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick("instagram")}
                className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all"
                title="Follow us on Instagram"
              >
                <Heart size={20} />
              </button>
              <button 
                onClick={() => handleSocialClick("email")}
                className="text-gray-300 hover:text-red-500 hover:scale-110 transition-all"
                title="Email us"
              >
                <Mail size={20} />
              </button>
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-gray-300 mb-4 border-b border-red-500 pb-2">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <button 
                      onClick={() => handleLinkClick(link.action)}
                      className="text-gray-400 hover:text-red-400 transition text-sm text-left hover:translate-x-1 transform"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest text-gray-300 mb-4 border-b border-red-500 pb-2">
              Get in Touch
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <Phone size={16} className="text-red-500 mt-1 shrink-0" />
                <div>
                  <a 
                    href="tel:+977-1-4000000"
                    className="text-sm text-gray-400 hover:text-red-400 transition"
                  >
                    +977-1-4000000
                  </a>
                  <p className="text-xs text-gray-500">24/7 Support</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Mail size={16} className="text-red-500 mt-1 shrink-0" />
                <a 
                  href="mailto:help@namastestay.np"
                  className="text-sm text-gray-400 hover:text-red-400 transition"
                >
                  help@namastestay.np
                </a>
              </div>
              <div className="flex gap-3 items-start">
                <MapPin size={16} className="text-red-500 mt-1 shrink-0" />
                <button
                  onClick={() => window.open("https://maps.google.com/?q=Kathmandu,Nepal", "_blank")}
                  className="text-sm text-gray-400 hover:text-red-400 transition text-left"
                >
                  Kathmandu, Nepal
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © 2024 Namaste Stay Nepal. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-gray-400">
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/?section=privacy");
                }}
                className="hover:text-red-400 transition"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/?section=terms");
                }}
                className="hover:text-red-400 transition"
              >
                Terms of Service
              </button>
              <button 
                onClick={() => {
                  window.scrollTo(0, 0);
                  navigate("/?section=cookies");
                }}
                className="hover:text-red-400 transition"
              >
                Cookie Policy
              </button>
            </div>
            <p className="text-sm font-semibold text-red-500">NPR - Nepali Rupee</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

