import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Mail,
  MessageSquare,
  HelpCircle,
  Send,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  User,
  Shield,
  Clock,
  Zap,
  Settings,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactFormData {
  name: string;
  contact: string;
  message: string;
}

export const Footer = () => {
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: "",
    contact: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData = [
    {
      question: "What is Scorpius Security Platform?",
      answer:
        "Scorpius is an advanced cybersecurity platform designed for elite security operations. It provides real-time threat detection, MEV monitoring, smart contract analysis, and comprehensive security auditing capabilities for blockchain and traditional systems.",
      icon: Shield,
    },
    {
      question: "How does the threat detection system work?",
      answer:
        "Our AI-powered threat detection system continuously monitors multiple data sources including smart contracts, mempool activity, and network traffic. It uses advanced pattern recognition and machine learning to identify potential threats in real-time, providing instant alerts and automated response recommendations.",
      icon: AlertCircle,
    },
    {
      question: "What are MEV Operations?",
      answer:
        "Maximum Extractable Value (MEV) operations refer to our ability to identify and capitalize on arbitrage opportunities in blockchain transactions. Our platform monitors mempool activity to detect profitable opportunities while maintaining ethical practices and compliance standards.",
      icon: Zap,
    },
    {
      question: "Is my data secure on the platform?",
      answer:
        "Absolutely. Scorpius employs military-grade encryption, zero-trust architecture, and multi-layer security protocols. All data is encrypted at rest and in transit, with regular security audits and compliance with international cybersecurity standards.",
      icon: Shield,
    },
    {
      question: "How do I access advanced features?",
      answer:
        "Advanced features are unlocked based on your license tier and security clearance level. Contact your administrator or use the contact form to request access to specific modules. Enterprise clients have full access to all platform capabilities.",
      icon: Settings,
    },
    {
      question: "What support is available?",
      answer:
        "We provide 24/7 technical support for all licensed users. This includes live chat, emergency hotline, dedicated account managers for enterprise clients, and comprehensive documentation. Response times vary by license tier and issue severity.",
      icon: Clock,
    },
    {
      question: "How often is the platform updated?",
      answer:
        "Scorpius receives continuous updates with security patches deployed immediately as needed. Feature updates are released monthly, with major version updates quarterly. All updates are thoroughly tested and deployed with zero downtime.",
      icon: FileText,
    },
    {
      question: "Can I integrate with existing security tools?",
      answer:
        "Yes, Scorpius offers extensive API integration capabilities and supports most industry-standard security tools and protocols. We provide custom integration support for enterprise clients to ensure seamless workflow integration.",
      icon: Settings,
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission - in real implementation, this would send to your backend
    try {
      // Mock API call delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Here you would typically send the form data to your backend
      console.log("Contact form submitted:", contactForm);

      setSubmitSuccess(true);
      setTimeout(() => {
        setShowContactModal(false);
        setSubmitSuccess(false);
        setContactForm({ name: "", contact: "", message: "" });
      }, 2000);
    } catch (error) {
      console.error("Failed to submit contact form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setContactForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8, y: 20 },
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      {/* Footer */}
      <footer
        style={{
          padding: "24px 32px",
          borderTop: "1px solid rgba(0, 255, 136, 0.2)",
          backgroundColor: "#000000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "14px",
          fontFamily: "JetBrains Mono, monospace",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#00ff88", fontWeight: "600" }}>
            © 2025 Scorpius Security Platform
          </span>
          <span style={{ color: "#666666" }}>|</span>
          <motion.button
            whileHover={{ scale: 1.05, color: "#00ffff" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowContactModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#cccccc",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Mail size={14} />
            Contact
          </motion.button>
          <span style={{ color: "#666666" }}>|</span>
          <motion.button
            whileHover={{ scale: 1.05, color: "#00ffff" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFAQModal(true)}
            style={{
              background: "none",
              border: "none",
              color: "#cccccc",
              cursor: "pointer",
              fontSize: "14px",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <HelpCircle size={14} />
            FAQ
          </motion.button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#00ff88",
              boxShadow: "0 0 10px rgba(0, 255, 136, 0.8)",
            }}
          />
          <span
            style={{ color: "#00ff88", fontSize: "12px", fontWeight: "600" }}
          >
            SECURE CONNECTION
          </span>
        </div>
      </footer>

      {/* Contact Modal */}
      <AnimatePresence>
        {showContactModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setShowContactModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                border: "1px solid rgba(0, 255, 136, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                maxWidth: "500px",
                boxShadow: "0 0 40px rgba(0, 255, 136, 0.2)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#00ff88",
                    margin: "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <MessageSquare size={20} />
                  Contact Support
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, color: "#ff4444" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowContactModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#cccccc",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Contact Form */}
              {!submitSuccess ? (
                <form onSubmit={handleContactSubmit}>
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#cccccc",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      <User
                        size={14}
                        style={{ display: "inline", marginRight: "6px" }}
                      />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#cccccc",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      <Phone
                        size={14}
                        style={{ display: "inline", marginRight: "6px" }}
                      />
                      Phone / Email *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.contact}
                      onChange={(e) =>
                        handleInputChange("contact", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                      placeholder="Phone number or email address"
                    />
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "14px",
                        color: "#cccccc",
                        marginBottom: "8px",
                        fontWeight: "500",
                      }}
                    >
                      <MessageSquare
                        size={14}
                        style={{ display: "inline", marginRight: "6px" }}
                      />
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        border: "1px solid rgba(0, 255, 136, 0.3)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        outline: "none",
                        resize: "vertical",
                        minHeight: "100px",
                      }}
                      placeholder="Describe your question or issue..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: "100%",
                      padding: "12px 24px",
                      backgroundColor: isSubmitting
                        ? "rgba(0, 255, 136, 0.3)"
                        : "rgba(0, 255, 136, 0.2)",
                      border: "1px solid rgba(0, 255, 136, 0.5)",
                      borderRadius: "8px",
                      color: "#00ff88",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid rgba(0, 255, 136, 0.3)",
                            borderTop: "2px solid #00ff88",
                            borderRadius: "50%",
                          }}
                        />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Send Message
                      </>
                    )}
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(0, 255, 136, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                      border: "2px solid #00ff88",
                    }}
                  >
                    <Check size={24} color="#00ff88" />
                  </motion.div>
                  <h3
                    style={{
                      fontSize: "18px",
                      color: "#00ff88",
                      marginBottom: "8px",
                      fontWeight: "600",
                    }}
                  >
                    Message Sent Successfully!
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#cccccc",
                      margin: "0",
                      lineHeight: "1.5",
                    }}
                  >
                    Thank you for contacting us. We'll get back to you within 24
                    hours.
                  </p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAQ Modal */}
      <AnimatePresence>
        {showFAQModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(10px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setShowFAQModal(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.95)",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                borderRadius: "16px",
                padding: "32px",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "80vh",
                overflow: "auto",
                boxShadow: "0 0 40px rgba(0, 255, 255, 0.2)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                  position: "sticky",
                  top: "0",
                  backgroundColor: "rgba(0, 0, 0, 0.95)",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(0, 255, 255, 0.2)",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#00ffff",
                    margin: "0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <HelpCircle size={20} />
                  Frequently Asked Questions
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, color: "#ff4444" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFAQModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#cccccc",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* FAQ Items */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {faqData.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      border: "1px solid rgba(0, 255, 255, 0.2)",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <motion.button
                      whileHover={{ backgroundColor: "rgba(0, 255, 255, 0.1)" }}
                      onClick={() => toggleFAQ(index)}
                      style={{
                        width: "100%",
                        padding: "16px 20px",
                        backgroundColor: "transparent",
                        border: "none",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(0, 255, 255, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid rgba(0, 255, 255, 0.4)",
                          }}
                        >
                          <faq.icon size={16} color="#00ffff" />
                        </div>
                        <span>{faq.question}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} color="#00ffff" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {expandedFAQ === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: "hidden" }}
                        >
                          <div
                            style={{
                              padding: "0 20px 20px",
                              fontSize: "13px",
                              lineHeight: "1.6",
                              color: "#cccccc",
                              borderTop: "1px solid rgba(0, 255, 255, 0.1)",
                              paddingTop: "16px",
                            }}
                          >
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              {/* Footer note */}
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  backgroundColor: "rgba(0, 255, 136, 0.1)",
                  borderRadius: "8px",
                  border: "1px solid rgba(0, 255, 136, 0.2)",
                  fontSize: "12px",
                  color: "#999999",
                  textAlign: "center",
                }}
              >
                Can't find what you're looking for? Use the contact form to
                reach our support team directly.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Footer;
