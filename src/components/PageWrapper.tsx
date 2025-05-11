import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const PageWrapper = ({ children, className = "" }: PageWrapperProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"      variants={pageTransition}
      className={`mt-16 min-h-[calc(100vh-4rem)] ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
