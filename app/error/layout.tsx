import type React from "react"
import type { Metadata } from "next"
import { StructuredData } from "@/components/seo/StructuredData"
import { defaultSEO } from "@/config/seo"

export const metadata: Metadata = {
  title: "Error - EcomPin",
  description: "Something went wrong on EcomPin. Please try again or return home.",
}

const errorPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Error - EcomPin",
  "description": "Something went wrong on EcomPin. Please try again or return home.",
  "url": `${defaultSEO.siteUrl}/error`,
}

export default function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData id="error-schema" data={errorPageSchema} />
      {children}
    </>
  )
}