"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DocumentItem, initialDocuments } from "@/lib/mock-data";

interface DocumentContextValue {
  documents: DocumentItem[];
  addDocuments: (items: DocumentItem[]) => void;
  updateDocument: (id: string, update: Partial<DocumentItem>) => void;
}

const DocumentContext = createContext<DocumentContextValue | undefined>(undefined);

const STORAGE_KEY = "contra-documents";

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setDocuments(JSON.parse(stored));
    } else {
      setDocuments(initialDocuments);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents]);

  const addDocuments = useCallback((items: DocumentItem[]) => {
    setDocuments((prev) => [...items, ...prev]);
  }, []);

  const updateDocument = useCallback((id: string, update: Partial<DocumentItem>) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, ...update } : doc))
    );
  }, []);

  const value = useMemo(
    () => ({
      documents,
      addDocuments,
      updateDocument
    }),
    [documents, addDocuments, updateDocument]
  );

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
}

export function useDocuments() {
  const ctx = useContext(DocumentContext);
  if (!ctx) {
    throw new Error("useDocuments must be used within DocumentProvider");
  }
  return ctx;
}
