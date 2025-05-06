import { Mail, Instagram, Linkedin } from "lucide-react";

export default function ContactPage() {
  return (
    <section className="container mx-auto py-12 px-4 md:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8 transition-transform hover:scale-[1.02]">
        
        <div className="text-center">
          <h1 className="font-bold text-3xl text-gray-800 mb-6">Contact & Social</h1>
          <p className="text-gray-600 mb-8">
            Feel free to reach out to me via email or connect on social media!
          </p>
        </div>

        {/* Email Section */}
        <div className="flex items-center gap-4 bg-gray-100 p-6 rounded-lg mb-6 hover:bg-gray-200 transition-colors">
          <Mail className="text-blue-600 w-8 h-8" />
          <div>
            <h2 className="font-semibold text-lg text-gray-700">Email</h2>
            <a
              href="mailto:svpraveenkaruparthi@gmail.com"
              className="text-blue-600 hover:underline"
            >
              svpraveenkaruparthi@gmail.com
            </a>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="bg-gray-100 p-6 rounded-lg hover:bg-gray-200 transition-colors">
          <h2 className="font-semibold text-lg text-gray-700 mb-4">Social Media</h2>
          
          <div className="flex justify-center md:justify-start space-x-6">
            <a
              href="https://www.instagram.com/svpraveen_174/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-pink-500 transition-colors"
              aria-label="Visit Instagram Profile"
            >
              <Instagram className="w-6 h-6" />
              <span>Instagram</span>
            </a>

            <a
              href="https://www.linkedin.com/in/ksvpraveen/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 hover:text-blue-700 transition-colors"
              aria-label="Visit LinkedIn Profile"
            >
              <Linkedin className="w-6 h-6" />
              <span>LinkedIn</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
