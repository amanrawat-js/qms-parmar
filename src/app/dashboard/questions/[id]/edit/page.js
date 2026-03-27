"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Languages,
  CheckCircle2,
  X,
  Tag as TagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LANGUAGE_OPTIONS,
  LANGUAGE_CODES,
  LANGUAGES,
  LANGUAGE_LABEL,
} from "@/enums/language";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";


const CKEditorComponent = dynamic(
  () => import("@/components/CKEditor4").then((mod) => mod.default),
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

export default function EditQuestionPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tagInput, setTagInput] = useState("");

  const [exams, setExams] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  const [formData, setFormData] = useState(null);

  // 1. Initial Data Fetching (Question + Lists)
  useEffect(() => {
    const initPage = async () => {
      try {
        // Fetch question details
        const qRes = await fetch(`/api/questions/${params.id}`);
        const qData = await qRes.json();

        // Fetch Exam/Subject Lists
        const [exRes, subRes] = await Promise.all([
          fetch("/api/exams?publishedOnly=true"),
          fetch("/api/subjects?activeOnly=true"),
        ]);
        const exData = await exRes.json();
        const subData = await subRes.json();

        setExams(exData.exams || []);
        setSubjects(subData.subjects || []);

        // Initialize form with dynamic language map merger
        // Ensures if new languages were added to the system, the old question gets empty blocks for them
        const emptyBlocks = LANGUAGE_CODES.reduce((acc, lang) => {
          acc[lang] = {
            passage: "",
            text: "",
            solution: "",
            description: "",
            options: Array(4)
              .fill(0)
              .map((_, i) => ({ text: "", correctOption: i === 0 })),
          };
          return acc;
        }, {});

        // Extract plain IDs from populated objects
        const examId = qData.exam?._id || qData.exam || "";
        const shiftId = qData.shift?._id || qData.shift || "";
        const subjectId = qData.subject?._id || qData.subject || "";
        const topicId = qData.topic?._id || qData.topic || "";

        // Trigger cascading fetches for Shift and Topic based on existing data
        if (examId) {
          const sRes = await fetch(`/api/shifts?examId=${examId}`);
          const sData = await sRes.json();
          setShifts(sData.shifts || []);
        }
        if (subjectId) {
          const tRes = await fetch(`/api/topics?subjectId=${subjectId}&activeOnly=true`);
          const tData = await tRes.json();
          setTopics(tData.topics || []);
        }
        setFormData({
          ...qData,
          exam: examId,
          shift: shiftId,
          subject: subjectId,
          topic: topicId,
          content: { ...emptyBlocks, ...qData.content },
        });
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    initPage();
  }, [params.id]);

  if (fetching || !formData)
    return (
      <div className="p-10 text-center text-muted-foreground">
        Loading Question Data...
      </div>
    );

  // --- Handlers (Same as Create Page) ---
  const handleRootChange = async (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "exam") {
      setShifts([]);
      if (value) {
        const res = await fetch(`/api/shifts?examId=${value}`);
        const data = await res.json();
        setShifts(data.shifts || []);
      }
    }
    if (name === "subject") {
      setTopics([]);
      if (value) {
        const res = await fetch(`/api/topics?subjectId=${value}&activeOnly=true`);
        const data = await res.json();
        setTopics(data.topics || []);
      }
    }
  };

  const handleContentChange = (lang, field, value) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [lang]: { ...prev.content[lang], [field]: value },
      },
    }));
  };

  const handleOptionChange = (lang, index, value) => {
    const newOptions = [...formData.content[lang].options];
    newOptions[index].text = value;
    handleContentChange(lang, "options", newOptions);
  };

  const setCorrectOption = (lang, index) => {
    const newOptions = formData.content[lang].options.map((opt, i) => ({
      ...opt,
      correctOption: i === index,
    }));
    handleContentChange(lang, "options", newOptions);
  };

  const addTag = () => {
    const val = tagInput.trim();
    if (val && !formData.tags.includes(val)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, val] }));
      setTagInput("");
    }
  };

  const removeTag = (tag) =>
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Cleanup: Remove empty language blocks
    const cleanedContent = {};
    Object.keys(formData.content).forEach((lang) => {
      if (formData.content[lang].text?.trim())
        cleanedContent[lang] = formData.content[lang];
    });

    try {
      const res = await fetch(`/api/questions/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, content: cleanedContent }),
      });

      if (res.ok) {
        router.push("/dashboard/questions");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between bg-background/80 backdrop-blur-md py-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/questions">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Edit Question</h1>
            <Badge variant="outline" className="font-mono">
              {formData.id ?? formData._id}
            </Badge>
          </div>
        </div>
        <Button type="submit" disabled={loading} className="px-10">
          <Save className="mr-2 h-4 w-4" />{" "}
          {loading ? "Updating..." : "Update Question"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="space-y-4 bg-card p-5 border rounded-xl shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-widest text-primary/70">
              Hierarchy
            </h2>
            <select
              name="exam"
              value={formData.exam || ""}
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
            <select
              name="shift"
              value={formData.shift || ""}
              onChange={handleRootChange}
              className="w-full p-2 border rounded-md text-sm bg-background"
              required
            >
              <option value="">Select Shift</option>
              {shifts.map((sh) => (
                <option key={sh._id} value={sh._id}>
                  {sh.shiftLabel}
                </option>
              ))}
            </select>
            <select
              name="subject"
              value={formData.subject || ""}
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
            <select
              name="topic"
              value={formData.topic || ""}
              onChange={handleRootChange}
              className="w-full p-2 border rounded-md text-sm bg-background"
              required
            >
              <option value="">Select Topic</option>
              {topics.map((tp) => (
                <option key={tp._id} value={tp._id}>
                  {tp.topicName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 bg-card p-5 border rounded-xl shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-tight flex items-center gap-2">
              <TagIcon className="h-4 w-4" /> Tags
            </h2>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 bg-primary/5"
                >
                  {tag}{" "}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                placeholder="Add tag..."
                className="flex-1 bg-transparent outline-none text-sm min-w-[80px]"
              />
            </div>
          </div>
        </div>

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
                    value={formData.content[langCode]?.passage || ""}
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
                    value={formData.content[langCode]?.text || ""}
                    onChange={(e) =>
                      handleContentChange(langCode, "text", e.target.value)
                    }
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
