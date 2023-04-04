import { faMessage } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState, useEffect, useCallback, useRef, MutableRefObject } from 'react';
import PromptResponseList from '../PromptResponseList/PromptResponseList';
import { ResponseInterface } from '../PromptResponseList/response-interface';
import { InsightCardProps } from './insight-card-props-interface';
import './InsightCard.css';

export const InsightCard = (props: InsightCardProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRespCompleted, setIsRespCompleted] = useState(false);
    const [promptInput, setPromptInput] = useState('');
    const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
    const [questionList, setQuestionList] = useState<string[]>([]);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isQuestionLoading, setIsQuestionLoading] = useState(false);
    const responseListRef = useRef() as MutableRefObject<HTMLDivElement>;
    const chatAreaRef = useRef() as MutableRefObject<HTMLDivElement>;
    let loadInterval: number | undefined;

    
    useEffect(() => {
        streamGPTResult()
    }, [])

    const updatePrompt = (event:any) => {
        setPromptInput(event.target.value)
    }

    const delay = (ms: number) => {
        return new Promise( resolve => setTimeout(resolve, ms) );
    }

    const parseHtmlToJson = (htmlString: string) => {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(htmlString, 'text/html');
        const promptResponseList = responseListRef.current.querySelector('.prompt-response-list');
        const json:{role: string, content: string}[] = [];
        if (promptResponseList?.innerHTML === '') {
            return json;
        }
        const resps = promptResponseList?.querySelectorAll('.response-container') ?? [];
      
        for (let i = 0; i < resps.length; i++) {
          const resp = resps[i];
          const text = resp?.querySelector('.prompt-content')?.textContent?.trim() ?? '';
          if (text !== '') {
            if (resp.classList.contains('ai-resp')) {
                json.push({
                    'role': 'assistant',
                    'content': text,
                })
            }

            if (resp.classList.contains('user-input')) {
                json.push({
                    'role': 'user',
                    'content': text,
                })
            }
          }
        }
      
        return json;
      }

    const generateUniqueId = () => {
        const timestamp = Date.now();
        const randomNumber = Math.random();
        const hexadecimalString = randomNumber.toString(16);
    
        return `id-${timestamp}-${hexadecimalString}`;
    }

    const addResponse = (selfFlag: boolean, response?: string) => {
        const uid = generateUniqueId()
        setResponseList(prevResponses => [
          ...prevResponses,
          {
            id: uid,
            response,
            selfFlag
          },
        ]);
        return uid;
    }

    const updateResponse = (uid: string, updatedObject: Record<string, unknown>) => {
        setResponseList(prevResponses => {
          const updatedList = [...prevResponses]
          const index = prevResponses.findIndex((response) => response.id === uid);
          if (index > -1) {
            const preStr = updatedList[index]?.response === undefined ? '' : updatedList[index]?.response;
            const newResp = preStr + '\n' + updatedObject.response;
            updatedList[index] = {
              ...updatedList[index],
              ...updatedObject,
              response: newResp,
            }
          }
          return updatedList;
        });
    }

    const parseQuestions = (resp: string) => {
        const lines = resp.split('\n');
        const result = [];
        const len = Math.min(3, lines.length)

        for(let i = 0; i < len; i ++) {
            const line = lines[i].trim();
            const splitIdx = line.indexOf('.');
            if (splitIdx > -1 
                && isNaN(parseInt(line.substring(0, splitIdx).trim()))) 
            {
                result.push(line)
            } else {
                result.push(line.substring(splitIdx + 1))
            }
        }

        return result;
    }

    const fetchQuestions = () => {
        const _prevConversation = responseListRef.current?.innerHTML ?? '' !== '' 
            ? parseHtmlToJson(responseListRef.current.innerHTML)
            : []
        
        setIsQuestionLoading(true)

        fetch(`http://localhost:3001/questions`, {
            method: 'POST',
            headers: {
                'Accepts': '*/*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                prev: _prevConversation
            })
        })
        .then(response => response.text())
        .then(data => {
            setQuestionList(parseQuestions(data))
        })
        .catch(error => {
            console.error(error);
        })
        .finally(() => {
            setIsQuestionLoading(false)
        })
    }

    const streamGPTResult = () => {
        const _prompt = props.initialPrompt;
        const _prevConversation = responseListRef.current?.innerHTML ?? '' !== '' 
            ? parseHtmlToJson(responseListRef.current.innerHTML)
            : []

        if (_prevConversation.length === 0) {
            setIsLoading(true);
        }

        const uniqueId = addResponse(false);
        setIsRespCompleted(false)
        fetch(`http://localhost:3001/${props.chatEndpoint}`, {
            method: 'POST',
            headers: {
                'Accepts': '*/*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: _prompt, 
                prev: _prevConversation
            })
        })
        .then(response => {
            let decoder = new TextDecoder("utf-8");
            const reader = response.body?.getReader();
            reader?.read().then(function processText({done, value}) {
                if(done) {
                    setIsRespCompleted(true);
                    setTimeout(() => {
                        fetchQuestions();
                    }, 300)
                    return;
                }

                if (isLoading) {
                    setIsLoading(false)
                }

                updateResponse(uniqueId, {
                    response: decoder.decode(value),
                });

                reader.read().then(processText)
            })
        })
        .catch(error => {
            updateResponse(uniqueId, {
                // @ts-ignore
                response: `Error: ${error.message}`,
                error: true
            });
            setIsRespCompleted(true)
        })
    }

    const resetAndSetScroll = () => {
        setPromptInput('')
        setQuestionList([]);
        setIsInputFocused(false)
        setTimeout(() => {
            if (chatAreaRef.current && responseListRef.current) {
                chatAreaRef.current.scrollTop = responseListRef.current.offsetHeight;
            }
        }, 100)
    }

    const handleSubmit = () => {
        addResponse(true, promptInput);
        setTimeout(() => {
            streamGPTResult();
            resetAndSetScroll();
        }, 300)
    }

    const handleKeyPress = (event: { key: string; }) => {
        if (event.key === 'Enter' && promptInput.trim() !== '') {
            handleSubmit();
        }
    }

    const handleQuestionClick = (question: string) => {
        addResponse(true, question);
        setTimeout(() => {
            streamGPTResult();
            resetAndSetScroll();
        }, 300)
    }

    return (
        <div className={`insight-card scroll-y ${isLoading ? 'collapsed' : 'expanded'}`}>
            <div className='card-content'>
                <div className='title-area'>
                    <div className='card-title-wrapper'>
                        <div>{isLoading ? `Loading ${props.title}` : props.title}</div>
                        {isLoading && (
                            <div className='three-dot-loader'>
                                <div/><div/><div/>
                            </div>
                        )}
                    </div>
                </div>
                { !isLoading && (
                    <div ref={chatAreaRef} className='chat-area'>
                        { !isLoading && (
                            <div id="response-list" ref={responseListRef}>
                                <PromptResponseList 
                                    responseList={responseList} 
                                    key="response-list"/>
                                <div className={`three-dot-loader lg center top blue ${isRespCompleted ? 'hidden' : ''}`}>
                                    <div/><div/><div/>
                                </div>
                            </div>)}
                    </div>)
                }
                { questionList.length > 0 
                    && isInputFocused
                    && isRespCompleted
                    && promptInput == ''
                    && (
                    <div className='question-area'>
                        {questionList.map((q, i) => 
                            (<div
                                key={i}
                                className='ai-question'
                                onClick={() => handleQuestionClick(q)}
                            >{q}</div>)
                        )}
                    </div>
                )}
                { isRespCompleted && (
                    <div className='input-area'>
                        <div className='input-container'>
                            <input 
                                type="text" 
                                placeholder={`Ask me about the ${props.title.toLowerCase()}...`}
                                value={promptInput}
                                onChange={updatePrompt}
                                onKeyUp={handleKeyPress}
                                onFocus={() => {setIsInputFocused(true)}}
                                onBlur={() => {setTimeout(() => {setIsInputFocused(false)}, 300)}}
                            />
                            <button 
                                type="submit"
                                onClick={handleSubmit}>
                                <FontAwesomeIcon icon={faMessage}/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}