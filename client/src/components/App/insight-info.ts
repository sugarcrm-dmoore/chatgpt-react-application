import { InsightCardProps } from "../InsightCard/insight-card-props-interface";

export const focusConfig: InsightCardProps[] = [
    {
        id: 0,
        title: 'Industry Summary',
        //chatEndpoint: 'get-prompt-result',
        chatEndpoint: 'get-industry-prompt',
        initialPrompt: 'Rystad Energy',
    },
    {
        id: 1,
        title: 'Company Summary',
        chatEndpoint: 'get-company-prompt',
        initialPrompt: 'Rystad Energy',
    },
    {
        id: 2,
        title: 'Decision Maker Summary',
        chatEndpoint: 'get-employee-prompt',
        initialPrompt: 'Rystad Energy',
    },
    {
        id: 3,
        title: 'Case Summary',
        chatEndpoint: 'get-case-summary',
        initialPrompt: '',
    },
    {
        id: 4,
        title: 'Contact Information',
        chatEndpoint: 'get-contact-information',
        initialPrompt: '',
    }
];