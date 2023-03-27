import { InsightCardProps } from "../InsightCard/insight-card-props-interface";

export const focusConfig: InsightCardProps[] = [
    {
        id: 0,
        title: 'Industry Summary',
        chatEndpoint: 'get-prompt-result',
        initialPrompt: 'Energy',
    },
    {
        id: 1,
        title: 'Company Summary',
        chatEndpoint: 'get-prompt-result',
        initialPrompt: 'Rystad Energy',
    },
    {
        id: 2,
        title: 'Decision Maker Summary',
        chatEndpoint: 'get-prompt-result',
        initialPrompt: 'Rystad Energy',
    },
    {
        id: 3,
        title: 'Case Summary',
        chatEndpoint: 'get-prompt-result',
        initialPrompt: '',
    },
    {
        id: 4,
        title: 'Account History',
        chatEndpoint: 'get-prompt-result',
        initialPrompt: '',
    }
];