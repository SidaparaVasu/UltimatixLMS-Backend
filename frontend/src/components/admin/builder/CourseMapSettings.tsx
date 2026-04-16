import React, { useState } from "react";
import { CourseMaster } from "@/types/courses.types";
import {
   Target,
   Tag as TagIcon,
   BarChart,
   Plus,
   X,
} from "lucide-react";

interface CourseMapSettingsProps {
   course: CourseMaster;
}

export const CourseMapSettings: React.FC<CourseMapSettingsProps> = ({
   course,
}) => {
   const [localSkills, setLocalSkills] = useState(course.skills || []);
   const [localTags, setLocalTags] = useState(course.tags || []);

   // New State for Interactions
   const [newTag, setNewTag] = useState("");
   const [newSkillName, setNewSkillName] = useState("");
   const [newSkillLevel, setNewSkillLevel] = useState("BEGINNER");

   const [validityDays, setValidityDays] = useState<number>(365);
   const [isMandatory, setIsMandatory] = useState<boolean>(true);

   const handleAddTag = () => {
      if (newTag.trim() && !localTags.some((t) => t.tag_name === newTag.trim())) {
         setLocalTags([...localTags, { tag_name: newTag.trim() } as any]);
         setNewTag("");
      }
   };

   const handleRemoveTag = (tagName: string) => {
      setLocalTags(localTags.filter((t) => t.tag_name !== tagName));
   };

   const handleAddSkill = () => {
      if (newSkillName.trim()) {
         setLocalSkills([
            ...localSkills,
            {
               skill_name: newSkillName.trim(),
               target_level_name: newSkillLevel,
            } as any,
         ]);
         setNewSkillName("");
      }
   };

   const handleRemoveSkill = (skillName: string) => {
      setLocalSkills(localSkills.filter((s) => s.skill_name !== skillName));
   };

   return (
      <div className="flex flex-col h-full bg-[#161925] text-slate-300">
         <div className="p-4 space-y-5 flex-1 overflow-y-auto custom-scrollbar no-scrollbar">
            {/* Core Properties Summary */}
            <div className="space-y-3">
               <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-800 pb-2 flex items-center gap-2">
                  <BarChart size={12} /> Core Properties
               </h4>
               <div className="grid text-xs">
                  <div className="flex justify-between items-center bg-slate-800/30 p-2 rounded-t">
                     <span className="text-slate-500">Category</span>
                     <span className="font-medium text-slate-200">
                        {course.category_name || "-"}
                     </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/30 p-2">
                     <span className="text-slate-500">Difficulty</span>
                     <span className="font-medium text-slate-200">
                        {course.difficulty_level || "-"}
                     </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-800/30 p-2 rounded-b">
                     <span className="text-slate-500">Duration</span>
                     <span className="font-medium text-slate-200">
                        {course.estimated_duration_hours}h
                     </span>
                  </div>
               </div>
            </div>

            {/* Mapped Skills */}
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                     <Target size={12} /> Course Outcomes
                  </h4>
               </div>

               <div className="flex bg-[#0a0c10] border border-slate-700 rounded-md overflow-hidden">
                  <input
                     type="text"
                     value={newSkillName}
                     onChange={(e) => setNewSkillName(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleAddSkill()}
                     placeholder="Search Skills..."
                     className="flex-1 bg-transparent px-3 py-1.5 text-[11px] text-white focus:outline-none"
                  />
                  <select
                     value={newSkillLevel}
                     onChange={(e) => setNewSkillLevel(e.target.value)}
                     className="bg-transparent w-20 px-2 py-1.5 text-[9px] font-bold text-slate-400 tracking-tight border-l border-slate-700 focus:outline-none cursor-pointer appearance-none"
                  >
                     <option value="BEGINNER">Begineer</option>
                     <option value="INTERMEDIATE">Intermediate</option>
                     <option value="ADVANCED">Advanced</option>
                     <option value="EXPERT">Expert</option>
                  </select>
                  <button
                     onClick={handleAddSkill}
                     disabled={!newSkillName.trim()}
                     className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-3 flex items-center justify-center transition border-l border-slate-700"
                  >
                     <Plus size={14} />
                  </button>
               </div>

               {localSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pr-1 mt-2">
                     {localSkills.map((s, idx) => (
                        <div
                           key={idx}
                           className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded flex items-center gap-1 group cursor-default"
                        >
                           {s.skill_name}
                           <span className="text-blue-400 font-medium lowercase italic">
                              ({s.target_level_name})
                           </span>
                           <button
                              onClick={() => handleRemoveSkill(s.skill_name || "")}
                              className="text-slate-500 hover:text-red-400 ml-1"
                           >
                              <X size={10} />
                           </button>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="text-xs text-slate-500 italic text-left">
                     No learning skills mapped yet.
                  </div>
               )}
            </div>

            {/* Global Tags */}
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                     <TagIcon size={12} /> Tags
                  </h4>
               </div>

               <div className="flex mb-2">
                  <input
                     type="text"
                     value={newTag}
                     onChange={(e) => setNewTag(e.target.value)}
                     onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                     placeholder="Add a new tag e.g. 'Frontend'..."
                     className="flex-1 bg-[#0a0c10] border border-slate-700 rounded-l px-3 py-1 text-xs text-white focus:outline-none"
                  />
                  <button
                     onClick={handleAddTag}
                     disabled={!newTag.trim()}
                     className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-3 p-2 rounded-r transition text-xs font-bold"
                  >
                     <Plus size={14} />
                  </button>
               </div>

               {localTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                     {localTags.map((t, idx) => (
                        <span
                           key={idx}
                           className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold rounded flex items-center gap-1 group cursor-default"
                        >
                           #{t.tag_name || "tag"}
                           <button
                              onClick={() => handleRemoveTag(t.tag_name || "")}
                              className="text-slate-500 hover:text-red-400 ml-1"
                           >
                              <X size={10} />
                           </button>
                        </span>
                     ))}
                  </div>
               ) : (
                  <div className="text-xs text-slate-500 italic text-left">
                     No course tags applied.
                  </div>
               )}
            </div>

            {/* Course Constraints */}
            <div className="space-y-4">
               <div className="space-y-3">
                  <div>
                     <label className="text-xs text-slate-400 mb-2 block">
                        Validity Period (Days)
                     </label>
                     <div className="flex items-center bg-[#0a0c10] border border-slate-700 rounded-md overflow-hidden">
                        <input
                           type="number"
                           min="0"
                           value={validityDays}
                           onChange={(e) => setValidityDays(Number(e.target.value))}
                           className="w-full bg-transparent px-3 py-1.5 text-xs text-white focus:outline-none"
                        />
                        <span className="px-3 text-xs text-slate-500 border-l border-slate-700">
                           Days
                        </span>
                     </div>
                     <p className="text-[10px] text-slate-500 mt-2">
                        Set to 0 for lifetime validity.
                     </p>
                  </div>                  

                  <label className="flex flex-col pt-3 gap-2 cursor-pointer">
                     <div className="flex items-center gap-2">
                        <input
                           type="checkbox"
                           checked={isMandatory}
                           onChange={(e) => setIsMandatory(e.target.checked)}
                           className="w-4 h-4 mt-0.5 rounded border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                        />
                        <p className="text-sm font-semibold text-slate-400 leading-tight">
                           Is it mandatory course?
                        </p>
                     </div>
                     <p className="text-xs text-slate-500">
                        If enabled, learners mapped to this role must complete it for
                        compliance.
                     </p>
                  </label>
               </div>
            </div>
         </div>
      </div>
   );
};
