import React from "react";
import { motion } from "framer-motion";
import { Shield, FileText, AlertTriangle } from "lucide-react";

export const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-black text-white font-mono p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <motion.div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30" whileHover={{
                            scale: 1.05
                        }}>
                            <FileText className="h-8 w-8 text-red-400" />
                        </motion.div>
                        <div>
                            <h1 className="text-4xl font-bold text-red-400">
                                TERMS OF SERVICE
                            </h1>
                            <p className="text-gray-400">Scorpius Cybersecurity Platform</p>
                        </div>
                    </div>
                    <p className="text-gray-400">
                        Last updated: {new Date().toLocaleDateString()}
                    </p>
                </motion.div>

                {/* Content */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="space-y-8">
                    {/* Agreement */}
                    <section className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-400" />
                            <h2 className="text-2xl font-bold text-red-400">
                                1. Agreement to Terms
                            </h2>
                        </div>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                By accessing and using the Scorpius Cybersecurity Platform
                                ("Service"), you accept and agree to be bound by the terms and
                                provision of this agreement.
                            </p>
                            <p>
                                This Service is designed for cybersecurity professionals and
                                organizations seeking advanced blockchain security analysis
                                tools.
                            </p>
                        </div>
                    </section>

                    {/* Use License */}
                    <section className="bg-black/50 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            2. Use License
                        </h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                Permission is granted to temporarily use the Scorpius Platform
                                for legitimate cybersecurity purposes only. This is the grant of
                                a license, not a transfer of title, and under this license you
                                may not:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Use the Service for any illegal or unauthorized purpose</li>
                                <li>Attempt to reverse engineer or compromise the platform</li>
                                <li>Share login credentials with unauthorized parties</li>
                                <li>Use the Service to attack or harm other systems</li>
                                <li>Resell or redistribute the Service without permission</li>
                            </ul>
                        </div>
                    </section>

                    {/* Acceptable Use */}
                    <section className="bg-black/50 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            3. Acceptable Use Policy
                        </h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                The Scorpius Platform is intended for defensive cybersecurity
                                purposes only:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Smart contract vulnerability assessment</li>
                                <li>Blockchain security analysis</li>
                                <li>Educational cybersecurity research</li>
                                <li>
                                    Legitimate penetration testing with proper authorization
                                </li>
                                <li>Threat intelligence gathering for defensive purposes</li>
                            </ul>
                            <p className="text-yellow-400 font-semibold">
                                ⚠️ Any malicious use of this platform is strictly prohibited and
                                may result in immediate account termination and legal action.
                            </p>
                        </div>
                    </section>

                    {/* Privacy & Data */}
                    <section className="bg-black/50 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            4. Privacy & Data Protection
                        </h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                We take your privacy seriously. All data processed through the
                                Scorpius Platform is handled in accordance with our Privacy
                                Policy and applicable data protection laws.
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>User data is encrypted in transit and at rest</li>
                                <li>We do not share personal information with third parties</li>
                                <li>Scan results and analysis data belong to you</li>
                                <li>
                                    We may collect anonymized usage statistics for platform
                                    improvement
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Subscription & Billing */}
                    <section className="bg-black/50 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            5. Subscription & Billing
                        </h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                Scorpius operates on a subscription-based model with different
                                tiers:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Subscriptions are billed monthly or annually</li>
                                <li>All fees are non-refundable unless required by law</li>
                                <li>You may cancel your subscription at any time</li>
                                <li>
                                    Service access continues until the end of the billing period
                                </li>
                                <li>Price changes will be communicated 30 days in advance</li>
                            </ul>
                        </div>
                    </section>

                    {/* Disclaimer */}
                    <section className="bg-black/50 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            6. Disclaimer
                        </h2>
                        <div className="text-gray-300 space-y-4">
                            <p>
                                The information on this platform is provided on an "as is"
                                basis. To the fullest extent permitted by law, this Company:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>
                                    Excludes all representations and warranties relating to this
                                    Service
                                </li>
                                <li>
                                    Does not guarantee the accuracy of security analysis results
                                </li>
                                <li>
                                    Is not liable for any indirect, special, or consequential
                                    damages
                                </li>
                                <li>
                                    Cannot guarantee 100% detection of all security
                                    vulnerabilities
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* Contact */}
                    <section className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">
                            7. Contact Information
                        </h2>
                        <div className="text-gray-300">
                            <p>
                                If you have any questions about these Terms of Service, please
                                contact us at:
                            </p>
                            <div className="mt-4 font-mono">
                                <p>📧 Email: legal@scorpius.security</p>
                                <p>🌐 Website: https://scorpius.security</p>
                                <p>📍 Legal Department</p>
                            </div>
                        </div>
                    </section>
                </motion.div>

                {/* Footer */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-12 text-center text-gray-500 text-sm">
                    <p>© 2024 Scorpius Cybersecurity Platform. All rights reserved.</p>
                    <p className="mt-2">
                        This document was last updated on {new Date().toLocaleDateString()}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};