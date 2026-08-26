import { useState, useMemo } from "react";
import {
  FaInfoCircle,
  FaBuilding,
  FaEnvelope,
  FaPhone,
  FaGlobe,
  FaHeadset,
  FaMapMarkerAlt,
} from "react-icons/fa";
import BodyHead from "../../components/common/BodyHead";
import VMSDetails from "../../components/about/VMSDetails";
import defaultLogo from "../../assets/logo-new.png";

const parseDescription = (text) => {
  if (!text) return null;
  const cleaned = text.replace(/\/n\/n\/n/g, "\n").replace(/\\n/g, "\n");
  const lines = cleaned.split("\n");
  return lines.map((line, lineIdx) => {
    if (line.trim() === "") return <br key={`br-${lineIdx}`} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-[var(--text-dark)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={i}>{part}</span>;
    });
    return (
      <span key={`line-${lineIdx}`}>
        {rendered}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
};

const DEFAULT_PROFILE = {
  companyName: "Surakshit City",
  tagline: "Protection In Every Connection",
  description:
    "Welcome to **Surakshit City** — a next-gen AI-powered Video Management System designed for modern security infrastructure.\n\nOur platform integrates **Real-Time Surveillance**, **Facial Recognition**, **License Plate Recognition (LPR)**, and **AI-driven Analytics** into a single unified dashboard.\n\nWith support for **1000+ cameras**, **cloud backup**, and **mobile app integration**, Surakshit City delivers enterprise-grade security solutions for smart cities, industrial complexes, and critical infrastructure.\n\nBuilt with a commitment to **privacy**, **reliability**, and **24/7 support**, we ensure your assets are always protected.",
  address: "PALAM VIHAR SECTOR 2 GURUGRAM, HARYANA, INDIA",
  email: "connect@surakshitcity.com",
  phone: "+91-7999999367",
  website: "www.surakshitcity.com",
  logo: "",
  founded: "2024",
  version: "v2.4.0",
};

const DEFAULT_SUPPORT = {
  title: "SURAKSHIT VMS Support",
  description: "Need help? Reach out to our support team.",
  phone: "+91-7999999367",
  email: "support@surakshitcity.com",
  website: "www.surakshitcity.com",
  address: "New Delhi, India",
  hours: "Monday - Saturday, 9:00 AM - 6:00 PM IST",
};

const About = () => {
  const [companyInfo] = useState(() => {
    const saved = localStorage.getItem("vms_company_profile");
    return saved
      ? { ...DEFAULT_PROFILE, ...JSON.parse(saved) }
      : DEFAULT_PROFILE;
  });

  const [supportInfo] = useState(() => {
    const saved = localStorage.getItem("vms_support_contact");
    return saved
      ? { ...DEFAULT_SUPPORT, ...JSON.parse(saved) }
      : DEFAULT_SUPPORT;
  });

  return (
    <div className="flex flex-col h-full min-w-0 relative overflow-hidden">
      {/* ================= HEADER ================= */}
      <BodyHead>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2 sm:gap-0">
          <div className="flex items-center gap-2">
            <div className=" flex-shrink-0">
              <FaInfoCircle className="text-[var(--primary-color)] text-[22px]" />
            </div>
            <div>
              <h2 className="text-[18px] md:text-[18px] font-bold tracking-tight text-[var(--text-dark)] leading-none">
                About
              </h2>
            </div>
          </div>
        </div>
      </BodyHead>

      {/* ================= CONTENT ================= */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 md:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[55%_45%] gap-3 md:gap-4">
          {/* Left Column - VMS Details */}
          <div className="flex flex-col gap-3 md:gap-4">
            <VMSDetails />

            {/* Support & Contact Card */}
            <div className="bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden">
              <div className="bg-gradient-to-r from-[var(--primary-color)]/10 to-transparent p-2.5 sm:p-3 border-b border-[var(--border-color)]">
                <h3 className="text-[11px] sm:text-xs font-bold text-[var(--text-dark)] flex items-center gap-2">
                  <FaHeadset className="text-[var(--primary-color)]" />
                  Support & Contact
                </h3>
              </div>
              <div className="p-2.5 sm:p-3 space-y-2">
                {supportInfo.email && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-[10px] sm:text-[11px]">
                    <span className="text-[var(--text-muted)]">
                      Support Email
                    </span>
                    <a
                      href={`mailto:${supportInfo.email}`}
                      className="font-medium text-[var(--primary-color)] break-all sm:break-normal"
                    >
                      {supportInfo.email}
                    </a>
                  </div>
                )}
                {supportInfo.phone && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-[10px] sm:text-[11px]">
                    <span className="text-[var(--text-muted)]">
                      Support Phone
                    </span>
                    <span className="font-medium text-[var(--text-dark)]">
                      {supportInfo.phone}
                    </span>
                  </div>
                )}
                {supportInfo.website && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-[10px] sm:text-[11px]">
                    <span className="text-[var(--text-muted)]">Website</span>
                    <a
                      href={
                        supportInfo.website.startsWith("http")
                          ? supportInfo.website
                          : `https://${supportInfo.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--primary-color)] break-all sm:break-normal"
                    >
                      {supportInfo.website}
                    </a>
                  </div>
                )}
                {supportInfo.hours && (
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-0 text-[10px] sm:text-[11px]">
                    <span className="text-[var(--text-muted)]">
                      Support Hours
                    </span>
                    <span className="font-medium text-[var(--text-dark)]">
                      {supportInfo.hours}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Company Details */}
          <div>
            <div className="bg-[var(--input-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden h-full flex flex-col">
              <div className="bg-gradient-to-r from-[var(--primary-color)]/10 to-transparent px-3 py-3 border-b border-[var(--border-color)]">
                <h3 className="text-sm font-bold text-[var(--text-dark)] flex items-center gap-2">
                  <FaBuilding className="text-[var(--primary-color)]" />
                  Company Details
                </h3>
              </div>

              <div className="flex-1 flex flex-col items-center p-4 sm:p-5 md:p-6 gap-3 sm:gap-4 md:gap-5">
                {/* Logo */}
                <img
                  src={companyInfo.logo || defaultLogo}
                  alt={companyInfo.companyName}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain"
                />

                {/* Company Name */}
                <h4 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[var(--text-dark)] tracking-tight leading-tight text-center break-words">
                  {companyInfo.companyName}
                </h4>

                {/* Tagline */}
                <div className="flex items-center gap-2 sm:gap-3 w-full max-w-md">
                  <div className="flex-1 h-[1px] bg-gray-300"></div>
                  <p className="text-[10px] sm:text-xs md:text-sm text-[var(--text-muted)] whitespace-nowrap">
                    {companyInfo.tagline}
                  </p>
                  <div className="flex-1 h-[1px] bg-gray-300"></div>
                </div>

                {/* Description */}
                {companyInfo.description && (
                  <p className="text-[11px] sm:text-xs md:text-sm text-[var(--text-muted)] leading-relaxed text-left break-words max-w-lg">
                    {parseDescription(companyInfo.description)}
                  </p>
                )}
              </div>

              {/* Contact Info Footer */}
              <div className="border-t border-[var(--border-color)] p-[11.5px] ">
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {companyInfo.address && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center shrink-0">
                        <FaMapMarkerAlt
                          size={12}
                          className="text-[var(--primary-color)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Address
                        </p>
                        <p className="text-[11px] sm:text-xs font-medium text-[var(--text-dark)] break-words">
                          {companyInfo.address}
                        </p>
                      </div>
                    </div>
                  )}

                  {companyInfo.email && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center shrink-0">
                        <FaEnvelope
                          size={12}
                          className="text-[var(--primary-color)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Email
                        </p>
                        <a
                          href={`mailto:${companyInfo.email}`}
                          className="text-[11px] sm:text-xs font-medium text-[var(--primary-color)] break-all block"
                        >
                          {companyInfo.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {companyInfo.phone && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center shrink-0">
                        <FaPhone
                          size={12}
                          className="text-[var(--primary-color)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Phone
                        </p>
                        <p className="text-[11px] sm:text-xs font-medium text-[var(--text-dark)]">
                          {companyInfo.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {companyInfo.website && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--primary-color)]/10 flex items-center justify-center shrink-0">
                        <FaGlobe
                          size={12}
                          className="text-[var(--primary-color)]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] sm:text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                          Website
                        </p>
                        <a
                          href={
                            companyInfo.website.startsWith("http")
                              ? companyInfo.website
                              : `https://${companyInfo.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] sm:text-xs font-medium text-[var(--primary-color)] break-all block"
                        >
                          {companyInfo.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
