import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen bg-discord-tertiary"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-center space-y-6"
      >
        <h1 className="text-6xl font-bold text-discord-accent">404</h1>
        <p className="text-2xl text-discord-text-normal">Oops! Page not found</p>
        <p className="text-discord-text-muted">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/"
            className="btn btn-primary inline-block"
          >
            Go Home
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default NotFound; 