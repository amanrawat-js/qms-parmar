"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Languages, CheckCircle2, X, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LANGUAGE_OPTIONS, LANGUAGE_CODES, LANGUAGES, LANGUAGE_LABEL } from "@/enums/language";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";


const CKEditorComponent = dynamic(
  () => import("@/components/CKEditor5").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <Textarea
        className="w-full min-h-[100px] border p-3"
        placeholder="Loading editor..."
      />
    ),
  }
);

const MathJaxScript = dynamic(
  () => import("@/components/MathJaxScript").then((mod) => mod.default),
  { ssr: false }
);

export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preExamId = searchParams.get("examId") || "";
  const preShiftId = searchParams.get("shiftId") || "";

  const [loading, setLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  
  // Dropdown Lists
  const [exams, setExams] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);



  // 1. Dynamic State Initialization
  const createEmptyLanguageBlock = () => ({
    passage: "",
    text: "",
    solution: "",
    description: "",
    options: Array(4).fill(0).map((_, i) => ({ 
      text: "", 
      correctOption: i === 0 
    }))
  });

  const [formData, setFormData] = useState({
    code: "",
    exam: preExamId,
    shift: preShiftId,
    subject: "",
    topic: "",
    difficulty: "MEDIUM",
    tags: [],
    content: LANGUAGE_CODES.reduce((acc, lang) => {
      acc[lang] = createEmptyLanguageBlock();
      return acc;
    }, {}),
  });

  // 2. Initial Fetch (Exams & Subjects) + pre-populate shifts if examId in URL
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [exRes, subRes] = await Promise.all([
          fetch("/api/exams?publishedOnly=true"),
          fetch("/api/subjects?activeOnly=true")
        ]);
        const exData = await exRes.json();
        const subData = await subRes.json();
        setExams(exData.exams || []);
        setSubjects(subData.subjects || []);

        // If exam was pre-selected via URL, auto-fetch its shifts
        if (preExamId) {
          const shiftRes = await fetch(`/api/exams/${preExamId}/shifts`);
          const shiftData = await shiftRes.json();
          setShifts(shiftData.shifts || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchInitial();
  }, [preExamId]);

  // 3. Hierarchy Handlers (Removing useEffect dependency)
  const handleRootChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "exam") {
      setShifts([]);
      setFormData(prev => ({ ...prev, shift: "" }));
      if (value) {
        const res = await fetch(`/api/exams/${value}/shifts`);
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    }

    if (name === "subject") {
      setTopics([]);
      setFormData(prev => ({ ...prev, topic: "" }));
      if (value) {
        const res = await fetch(`/api/topics?subjectId=${value}&activeOnly=true`);
        const data = await res.json();
        setTopics(data.topics || []);
      }
    }
  };

  // 4. Tag Input Handlers
  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && formData.tags.length > 0) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  // 5. Multilingual Content Handlers
  const handleContentChange = (lang, field, value) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content[lang], [field]: value },
      }
    }));
  };

  const handleOptionChange = (lang, index, value) => {
    const newOptions = [...formData.content[lang].options];
    newOptions[index].text = value;
    handleContentChange(lang, "options", newOptions);
  };

  const setCorrectOption = (lang, index) => {
    const newOptions = formData.content[lang].options.map((opt, i) => ({
      ...opt, correctOption: i === index,
    }));
    handleContentChange(lang, "options", newOptions);
  };

  // 6. Submit Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Cleanup: Remove empty language blocks
    const cleanedContent = {};
    Object.keys(formData.content).forEach((lang) => {
      if (formData.content[lang].text.trim() !== "") {
        cleanedContent[lang] = formData.content[lang];
      }
    });

    if (Object.keys(cleanedContent).length === 0) {
      alert("Please provide content for at least one language.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, content: cleanedContent }),
      });

      if (res.ok) {
        // If came from exam questions page, go back there
        if (preExamId) {
          router.push(`/dashboard/exams/${preExamId}/questions`);
        } else {
          router.push("/dashboard/questions");
        }
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between sticky bg-background/80 backdrop-blur-md py-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/questions">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create Question</h1>
        </div>
        <Button type="submit" disabled={loading} className="px-10">
          <Save className="mr-2 h-4 w-4" />{" "}
          {loading ? "Saving..." : "Save Question"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="space-y-4 bg-card p-5 border rounded-xl shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-primary/70">
              Hierarchy
            </h2>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase">Exam</label>
              <select
                name="exam"
                value={formData.exam}
                onChange={handleRootChange}
                className="w-full p-2 border rounded-md text-sm bg-background"
                required
              >
                <option value="">Select Exam</option>
                {exams.map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.examName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase">Shift</label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleRootChange}
                className="w-full p-2 border rounded-md text-sm bg-background"
                required
                disabled={!formData.exam}
              >
                <option value="">Select Shift</option>
                {shifts.map((sh) => (
                  <option key={sh._id} value={sh._id}>
                    {sh.shiftLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleRootChange}
                className="w-full p-2 border rounded-md text-sm bg-background"
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((sub) => (
                  <option key={sub._id} value={sub._id}>
                    {sub.subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase">Topic</label>
              <select
                name="topic"
                value={formData.topic}
                onChange={handleRootChange}
                className="w-full p-2 border rounded-md text-sm bg-background"
                required
                disabled={!formData.subject}
              >
                <option value="">Select Topic</option>
                {topics.map((tp) => (
                  <option key={tp._id} value={tp._id}>
                    {tp.topicName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag Input Section */}
          <div className="space-y-4 bg-card p-5 border rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase">Manual Tags</h2>
            </div>

            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background min-h-[42px] focus-within:ring-2 ring-primary/20">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary border-primary/20"
                >
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={
                  formData.tags.length === 0 ? "Type tag & hit Enter..." : ""
                }
                className="flex-1 bg-transparent outline-none text-sm min-w-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs defaultValue={LANGUAGES.ENGLISH}>
            <TabsList className="flex w-full overflow-x-auto bg-muted/50 p-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <TabsTrigger
                  key={lang.code}
                  value={lang.code}
                  className="flex-1 gap-2"
                >
                  <Languages className="h-3 w-3" /> {lang.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {LANGUAGE_CODES.map((langCode) => (
              <TabsContent
                key={langCode}
                value={langCode}
                className="space-y-6 bg-card p-6 border rounded-xl shadow-sm mt-0"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Passage ({LANGUAGE_LABEL[langCode]})
                  </label>
                  {/* <Textarea
                    placeholder="Enter passage context..."
                    value={formData.content[langCode].passage}
                    onChange={(e) =>
                      handleContentChange(langCode, "passage", e.target.value)
                    }
                  /> */}

                  <CKEditorComponent
                    initialData={formData.content[langCode].passage}
                    onChange={(data) =>
                      handleContentChange(langCode, "passage", data)
                    }
                    config={{ height: 200 }}
                    required={langCode === LANGUAGES.ENGLISH}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold">
                    Question Text ({LANGUAGE_LABEL[langCode]})
                  </label>
                  {/* <Textarea
                    className="min-h-[100px] text-lg"
                    placeholder="Type the question..."
                    value={formData.content[langCode].text}
                    onChange={(e) =>
                      handleContentChange(langCode, "text", e.target.value)
                    }
                    required={langCode === LANGUAGES.ENGLISH}
                  /> */}
                  <CKEditorComponent
                    initialData={formData.content[langCode].text}
                    onChange={(data) =>
                      handleContentChange(langCode, "text", data)
                    }
                    config={{ height: 200 }}
                    required={langCode === LANGUAGES.ENGLISH}
                  />
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="grid gap-4">
                    {formData.content[langCode].options.map((option, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between w-full items-center">
                          <label className="text-sm font-semibold">
                            Option {idx + 1} ({LANGUAGE_LABEL[langCode]})
                          </label>
                          <div className="flex items-center gap-2">
                            <Label htmlFor="toggle">
                              Set as Correct Option
                            </Label>
                            <Checkbox
                              checked={option.correctOption} // Control the state
                              onCheckedChange={() =>
                                setCorrectOption(langCode, idx)
                              }
                            />
                          </div>
                          {/* <Button
                            type="button"
                            variant={
                              option.correctOption ? "default" : "outline"
                            }
                            size="icon"
                            className="shrink-0 mt-2"
                            onClick={() => setCorrectOption(langCode, idx)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button> */}
                        </div>

                        {/* <Textarea
                          placeholder={`Option ${idx + 1}`}
                          value={option.text}
                          onChange={(e) =>
                            handleOptionChange(langCode, idx, e.target.value)
                          }
                          required={langCode === LANGUAGES.ENGLISH}
                        /> */}

                        <CKEditorComponent
                          initialData={option.text}
                          onChange={(data) =>
                            handleOptionChange(langCode, idx, data)
                          }
                          config={{ height: 100 }}
                          required={langCode === LANGUAGES.ENGLISH}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6 pt-6 border-t">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Solution ({LANGUAGE_LABEL[langCode]})
                    </label>
                    {/* <Textarea
                      placeholder="Explain the answer..."
                      className="bg-muted/20"
                      value={formData.content[langCode].solution}
                      onChange={(e) =>
                        handleContentChange(
                          langCode,
                          "solution",
                          e.target.value
                        )
                      }
                    /> */}

                    <CKEditorComponent
                      initialData={formData.content[langCode].solution}
                      onChange={(data) =>
                        handleContentChange(langCode, "solution", data)
                      }
                      config={{ height: 200 }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">
                      Description ({LANGUAGE_LABEL[langCode]})
                    </label>
                    {/* <Textarea
                      placeholder="Extra notes..."
                      className="bg-muted/20"
                      value={formData.content[langCode].description}
                      onChange={(e) =>
                        handleContentChange(
                          langCode,
                          "description",
                          e.target.value
                        )
                      }
                    /> */}

                    <CKEditorComponent
                      initialData={formData.content[langCode].description}
                      onChange={(data) =>
                        handleContentChange(langCode, "description", data)
                      }
                      config={{ height: 200 }}
                    />
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </form>
  );
}