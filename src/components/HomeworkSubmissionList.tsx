import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ClipboardList, 
  Edit3, 
  CheckCircle2, 
  RotateCcw,
  Search,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  X,
  Download,
  Share2,
  Calendar
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

interface Assignment {
  id: string;
  name: string;
  remark: string;
  submittedIds: number[];
}

interface HomeworkSubmissionListProps {
  students: Student[];
  onBack: () => void;
  dateKey: string;
  onOpenDatePicker: () => void;
}

export default function HomeworkSubmissionList({ students, onBack, dateKey, onOpenDatePicker }: HomeworkSubmissionListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const savedForDate = localStorage.getItem(`homework_v3_archive_${dateKey}`);
    if (savedForDate) {
      return JSON.parse(savedForDate);
    }
    
    // If no data for this date, try to load from the latest available archive or template
    const template = localStorage.getItem('homework_v3_template');
    if (template) {
      const parsed = JSON.parse(template);
      return parsed.map((a: Assignment) => ({ ...a, submittedIds: [] }));
    }
    
    // Default initial assignment
    return [{
      id: Date.now().toString(),
      name: '数学作业',
      remark: '',
      submittedIds: []
    }];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Save to date-specific archive and template
  useEffect(() => {
    localStorage.setItem(`homework_v3_archive_${dateKey}`, JSON.stringify(assignments));
    // Also save as template for future use (without submittedIds)
    const template = assignments.map(a => ({ ...a, submittedIds: [] }));
    localStorage.setItem('homework_v3_template', JSON.stringify(template));
  }, [assignments, dateKey]);

  // Handle date change while the component is mounted
  useEffect(() => {
    const savedForDate = localStorage.getItem(`homework_v3_archive_${dateKey}`);
    if (savedForDate) {
      setAssignments(JSON.parse(savedForDate));
    } else {
      // If no data for this date, use template
      const template = localStorage.getItem('homework_v3_template');
      if (template) {
        const parsed = JSON.parse(template);
        setAssignments(parsed.map((a: Assignment) => ({ ...a, submittedIds: [] })));
      } else {
        setAssignments([{
          id: Date.now().toString(),
          name: '数学作业',
          remark: '',
          submittedIds: []
        }]);
      }
    }
  }, [dateKey]);

  const addAssignment = () => {
    const newAssignment: Assignment = {
      id: Date.now().toString(),
      name: `新作业 ${assignments.length + 1}`,
      remark: '',
      submittedIds: []
    };
    setAssignments([...assignments, newAssignment]);
  };

  const removeAssignment = (id: string) => {
    if (assignments.length <= 1) return;
    if (confirm('确定要删除这项作业吗？相关上交记录也将被清除。')) {
      setAssignments(assignments.filter(a => a.id !== id));
    }
  };

  const updateAssignment = (id: string, updates: Partial<Assignment>) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const toggleSubmission = (assignmentId: string, studentId: number) => {
    setAssignments(assignments.map(a => {
      if (a.id === assignmentId) {
        const isSubmitted = a.submittedIds.includes(studentId);
        return {
          ...a,
          submittedIds: isSubmitted 
            ? a.submittedIds.filter(id => id !== studentId)
            : [...a.submittedIds, studentId]
        };
      }
      return a;
    }));
  };

  const resetAll = () => {
    if (confirm('确定要重置今日所有作业的上交状态吗？')) {
      setAssignments(assignments.map(a => ({ ...a, submittedIds: [] })));
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.name.includes(searchQuery) || s.id.toString().includes(searchQuery)
    );
  }, [students, searchQuery]);

  // Analysis Logic
  const analysisData = useMemo<Record<number, string[]>>(() => {
    const unsubmittedMap: Record<number, string[]> = {};
    students.forEach(s => {
      const missing = assignments
        .filter(a => !a.submittedIds.includes(s.id))
        .map(a => a.name);
      if (missing.length > 0) {
        unsubmittedMap[s.id] = missing;
      }
    });
    return unsubmittedMap;
  }, [students, assignments]);

  const copyAnalysisToClipboard = () => {
    const text = Object.entries(analysisData)
      .map(([id, missing]) => {
        const student = students.find(s => s.id === parseInt(id));
        return `${student?.id}号 ${student?.name}: 未交 [${(missing as string[]).join(', ')}]`;
      })
      .join('\n');
    
    const header = `作业未交名单统计 (${dateKey})\n------------------\n`;
    navigator.clipboard.writeText(header + text);
    alert('未交名单已复制到剪贴板！');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              作业上交多项统计
              <span className="text-sm font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100">
                {assignments.length} 项任务
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 font-medium">同步宇航员档案名单 · 共 {students.length} 位学生</p>
              <span className="text-slate-300">|</span>
              <button 
                onClick={onOpenDatePicker}
                className="flex items-center gap-1.5 text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                <Calendar size={14} />
                {dateKey}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={addAssignment}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
          >
            <Plus size={20} /> 增加作业项
          </button>
          <button 
            onClick={() => setShowAnalysis(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
          >
            <FileText size={20} /> 一键分析未交
          </button>
          <button 
            onClick={resetAll}
            className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
            title="重置所有状态"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Assignment Config Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {assignments.map((assignment, idx) => (
          <div key={assignment.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 group relative">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs ${
                ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'][idx % 5]
              }`}>
                {idx + 1}
              </div>
              <input 
                type="text"
                value={assignment.name}
                onChange={(e) => updateAssignment(assignment.id, { name: e.target.value })}
                className="flex-1 font-black text-slate-700 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-colors"
                placeholder="作业名称 (如: 数学书)"
              />
              <button 
                onClick={() => removeAssignment(assignment.id)}
                className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
              <Edit3 size={14} className="text-slate-400" />
              <input 
                type="text"
                value={assignment.remark}
                onChange={(e) => updateAssignment(assignment.id, { remark: e.target.value })}
                className="bg-transparent text-xs font-bold text-slate-500 outline-none w-full"
                placeholder="添加作业备注 (如: P12-13页)"
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
              <span className="text-slate-400">已收: {assignment.submittedIds.length}</span>
              <span className="text-rose-400">待收: {students.length - assignment.submittedIds.length}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="搜索姓名或学号快速定位..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-16 bg-white rounded-[1.5rem] pl-14 pr-6 shadow-sm border border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-medium"
        />
      </div>

      {/* Student Grid - Multi-Assignment View */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
        {filteredStudents.map((student) => (
          <div 
            key={student.id}
            className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all flex flex-col items-center"
          >
            <div className="text-xl font-black text-slate-800 mb-0.5 leading-none">{student.id}</div>
            <div className="text-[10px] font-bold text-slate-400 mb-3 truncate w-full text-center">{student.name}</div>
            
            <div className="flex flex-wrap justify-center gap-2">
              {assignments.map((a, idx) => {
                const isSubmitted = a.submittedIds.includes(student.id);
                const colors = [
                  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500'
                ];
                const activeColor = colors[idx % colors.length];
                
                return (
                  <button
                    key={a.id}
                    onClick={() => toggleSubmission(a.id, student.id)}
                    title={`${a.name}: ${isSubmitted ? '已交' : '未交'}`}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                      isSubmitted 
                        ? `${activeColor} text-white shadow-md scale-105` 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                    }`}
                  >
                    {isSubmitted ? <CheckCircle2 size={20} /> : <span className="text-sm font-black">{idx + 1}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {showAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="bg-emerald-600 p-6 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <FileText size={24} />
                  <h3 className="text-xl font-black">今日未交名单深度分析</h3>
                </div>
                <button onClick={() => setShowAnalysis(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="space-y-6">
                  {Object.keys(analysisData).length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} />
                      </div>
                      <h4 className="text-xl font-black text-slate-800">全员已完成！</h4>
                      <p className="text-slate-400 font-bold mt-2">今天真是个高效的日子 ✨</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysisData).map(([id, missing]) => {
                          const student = students.find(s => s.id === parseInt(id));
                          return (
                            <div key={id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-start gap-4">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-700 shadow-sm border border-slate-100 shrink-0">
                                {student?.id}
                              </div>
                              <div className="flex-1">
                                <div className="font-black text-slate-800">{student?.name}</div>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(missing as string[]).map(m => (
                                    <span key={m} className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                                      未交: {m}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={copyAnalysisToClipboard}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} /> 复制统计文本
                </button>
                <button 
                  onClick={() => setShowAnalysis(false)}
                  className="px-8 bg-white text-slate-600 font-black py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
