import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, Clock, Brain, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { TextEffect } from "@/components/ui/text-effect";

export function Features() {
  return (
    <div className="w-full py-12 bg-black">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <TextEffect
            per="word"
            preset="blur"
            className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-600 bg-clip-text text-transparent mb-4"
          >
            Advanced Security Features
          </TextEffect>
          <TextEffect
            per="word"
            preset="fade"
            delay={0.5}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Comprehensive blockchain security analysis with cutting-edge
            technology and real-time threat detection.
          </TextEffect>
        </motion.div>

        <AnimatedGroup
          preset="blur-slide"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{
              scale: 1.05,
              y: -5,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10">
                    <Shield className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">100%</h3>
                    <p className="text-sm text-gray-400">Security Coverage</p>
                  </div>
                </div>
                <h4 className="text-white font-medium mb-2">Customizable</h4>
                <p className="text-gray-400 text-sm">
                  Secure by default with provident fugit and vero voluptate.
                  Magnam magni doloribus dolores voluptates a sapiente nisi.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <Zap className="h-6 w-6 text-cyan-400" />
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-white">
                    Lightning
                  </h3>
                  <p className="text-sm text-gray-400">Speed</p>
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">Faster than light</h4>
              <p className="text-gray-400 text-sm">
                Provident fugit vero voluptate. Magnam magni doloribus dolores
                voluptates inventore nisi.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <Activity className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Real-time
                  </h3>
                  <p className="text-sm text-gray-400">Analysis</p>
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">Faster than light</h4>
              <p className="text-gray-400 text-sm">
                Provident fugit vero voluptate. Voluptates a sapiente inventore
                nisi.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <Users className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Protected
                  </h3>
                  <p className="text-sm text-gray-400">Community</p>
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">
                Keep your loved ones safe
              </h4>
              <p className="text-gray-400 text-sm">
                Voluptate. Magnam magni doloribus dolores voluptates a sapiente
                inventore nisi.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <Brain className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    AI-Powered
                  </h3>
                  <p className="text-sm text-gray-400">Intelligence</p>
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">Smart Detection</h4>
              <p className="text-gray-400 text-sm">
                Advanced AI algorithms detect threats and vulnerabilities with
                unprecedented accuracy.
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-cyan-500/10">
                  <Clock className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">24/7</h3>
                  <p className="text-sm text-gray-400">Monitoring</p>
                </div>
              </div>
              <h4 className="text-white font-medium mb-2">
                Continuous Protection
              </h4>
              <p className="text-gray-400 text-sm">
                Round-the-clock monitoring ensures your assets are protected at
                all times.
              </p>
            </CardContent>
          </Card>
        </AnimatedGroup>

        <div className="mt-12 text-center">
          <div className="flex justify-center gap-8 items-center text-gray-400">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">Likeur</div>
              <div className="text-sm">Security Expert</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">M. Irung</div>
              <div className="text-sm">Lead Developer</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">B. Ng</div>
              <div className="text-sm">Blockchain Architect</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
