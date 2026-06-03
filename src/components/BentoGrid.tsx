import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, ClipboardCheck, DollarSign, ShieldAlert } from 'lucide-react';

export default function BentoGrid() {
  const cards = [
    {
      icon: <Sparkles className="w-6 h-6 text-[#c4a661] group-hover:scale-110 transition-transform duration-300" />,
      title: "AI Document Parsing",
      desc: "Drop PDF tickets, PNG receipts, or booking confirmation screenshots. Our AI natively understands itineraries, dates, and destinations in a flash.",
      colSpan: "md:col-span-2",
      color: "bg-[#111] border-white/5 rounded-sm"
    },
    {
      icon: <Calendar className="w-6 h-6 text-[#c4a661] group-hover:scale-110 transition-transform duration-300" />,
      title: "Interactive Timeline",
      desc: "Chronological vertical maps structured by theme. Day-by-day detail timelines with smart budget forecasts.",
      colSpan: "md:col-span-1",
      color: "bg-[#0c0c0c] border-white/5 rounded-sm"
    },
    {
      icon: <ClipboardCheck className="w-6 h-6 text-[#c4a661] group-hover:scale-110 transition-transform duration-300" />,
      title: "Smart Packing Assistant",
      desc: "No more forgotten gear. High-tech smart checklist personalized for your specific trip location weather and activity guidelines.",
      colSpan: "md:col-span-1",
      color: "bg-[#0c0c0c] border-white/5 rounded-sm"
    },
    {
      icon: <DollarSign className="w-6 h-6 text-[#c4a661] group-hover:scale-110 transition-transform duration-300" />,
      title: "Expense Tracker",
      desc: "Visual cost-share reports. Analyze budget allotments with micro-bar visualization metrics of lodging, activities, food and custom spending.",
      colSpan: "md:col-span-2",
      color: "bg-[#111] border-white/5 rounded-sm"
    }
  ];

  return (
    <div id="bento-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 mt-12">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          className={`group flex flex-col justify-between p-6 border ${card.color} shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-2px] ${card.colSpan}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: idx * 0.15 }}
        >
          <div>
            <div className="p-2.5 bg-white/5 rounded-sm w-fit mb-4 border border-white/5">
              {card.icon}
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight mb-2">
              {card.title}
            </h3>
            <p className="text-white/50 text-sm leading-relaxed">
              {card.desc}
            </p>
          </div>
          <div className="mt-6 flex items-center justify-end text-[9px] font-mono tracking-widest text-[#c4a661]">
            SECURE MODULE v1.2
          </div>
        </motion.div>
      ))}
    </div>
  );
}
