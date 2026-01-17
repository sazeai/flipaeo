import {
    Button,
    Heading,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";
import { EmailWrapper } from "./wrapper";

interface PlanRefilledEmailProps {
    articleCount?: number;
    nextBillingDate?: string;
    userName?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flipaeo.com";

export const PlanRefilledEmail = ({
    articleCount = 30,
    userName,
}: PlanRefilledEmailProps) => {
    const dashboardUrl = `${baseUrl}/dashboard`;
    const previewText = `Your content plan for the next month is ready.`;

    return (
        <EmailWrapper previewText={previewText}>
            <Heading style={h1}>Fresh Content Plan Ready 📅</Heading>

            <Text style={text}>
                {userName ? `Hi ${userName},` : "Hi there,"}
            </Text>

            <Text style={text}>
                Your auto-pilot just generated a fresh content plan! We've researched and scheduled <strong>{articleCount} new articles</strong> for the upcoming month.
            </Text>

            <Section style={card}>
                <Text style={statNumber}>{articleCount}</Text>
                <Text style={statLabel}>New Article Ideas</Text>
            </Section>

            <Section style={actionSection}>
                <Button href={dashboardUrl} style={button}>
                    View Content Plan
                </Button>
            </Section>

            <Text style={text}>
                These articles will be automatically written and published according to your schedule. You can pause or edit them anytime from your dashboard.
            </Text>
        </EmailWrapper>
    );
};

// Styles
const h1 = {
    color: "#333",
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center" as const,
    margin: "30px 0",
};

const text = {
    color: "#333",
    fontSize: "16px",
    lineHeight: "26px",
};

const card = {
    backgroundColor: "#f0fdf4", // Light green background
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center" as const,
    margin: "24px 0",
    border: "1px solid #bbf7d0",
};

const statNumber = {
    color: "#166534",
    fontSize: "36px",
    fontWeight: "bold",
    margin: "0",
};

const statLabel = {
    color: "#166534",
    fontSize: "14px",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginTop: "8px",
};

const actionSection = {
    textAlign: "center" as const,
    margin: "32px 0",
};

const button = {
    backgroundColor: "#000000",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "inline-block",
    padding: "12px 24px",
};

export default PlanRefilledEmail;
