import { useState } from "react";
import { motion } from "framer-motion";
import FadeIn from "../../animations/FadeIn";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
    }, 3000);
  };

  return (
    <section className="py-12 md:py-20 relative bg-white overflow-hidden">
      {/* Decorative subtle background blobs */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        <FadeIn>
          <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20">
            {/* Left Image */}
            <motion.div
              className="w-full max-w-sm md:w-1/2 flex justify-center"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <img 
                src="/home/newsletter_swagsync_bag.png" 
                alt="Subscribe" 
                className="w-full max-w-[350px] object-contain mix-blend-multiply"
              />
            </motion.div>

            {/* Right Content */}
            <div className="w-full md:w-1/2 flex flex-col items-center text-center">
              <motion.h2
                className="text-[32px] md:text-[40px] font-black text-[#111827] mb-2 tracking-[0.1em]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                SUBSCRIBE
              </motion.h2>

              <motion.p
                className="text-[15px] md:text-base text-gray-600 mb-8 font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Subscribe to our newsletter and stay updated.
              </motion.p>

              <motion.form
                onSubmit={handleSubmit}
                className="flex flex-col items-center w-full max-w-[400px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="enter your mail id"
                  required
                  className="w-full bg-transparent border-b-2 border-gray-200 focus:border-[#4648D4] px-2 py-3 outline-none text-[#111827] placeholder-gray-400 text-sm font-medium transition-colors mb-6 text-center md:text-left"
                />
                
                <motion.button
                  type="submit"
                  className="px-10 py-2.5 text-white font-semibold rounded-full text-[13px] tracking-wide"
                  style={{
                    background: "linear-gradient(90deg, #1d4ed8 0%, #60a5fa 100%)",
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isSubmitted ? "subscribed!" : "subscribe"}
                </motion.button>
              </motion.form>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default Newsletter;
