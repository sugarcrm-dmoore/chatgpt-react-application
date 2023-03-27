import { faMessage, faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useState, useEffect } from 'react';
import PromptResponseList from '../PromptResponseList/PromptResponseList';
import { ResponseInterface } from '../PromptResponseList/response-interface';
import { InsightCardProps } from './insight-card-props-interface';
import './InsightCard.css';

export const InsightCard = (props: InsightCardProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isRespCompleted, setIsRespCompleted] = useState(false);
    const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
    let loadInterval: number | undefined;

    
    useEffect(() => {
        const timer = setTimeout(() => {
            streamGPTResult()
            //getGPTResult();
        }, 2000);
        
        return () => clearTimeout(timer);
    }, [])

    const delay = (ms: number) => {
        return new Promise( resolve => setTimeout(resolve, ms) );
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

    const streamGPTResult = () => {
        const _prompt = props.initialPrompt;

        setIsLoading(true);

        const uniqueId = addResponse(false);

        fetch('http://localhost:3001/get-prompt-result', {
            method: 'POST',
            headers: {
                'Accepts': 'text/event-stream',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({prompt: _prompt})
        })
        .then(response => {
            let decoder = new TextDecoder("utf-8");
            const reader = response.body?.getReader();
            reader?.read().then(function processText({done, value}) {
                if(done) {
                    setIsRespCompleted(true);
                    return;
                }

                if (isLoading) {
                    setIsLoading(false)
                }
                updateResponse(uniqueId, {
                    response: decoder.decode(value).trim(),
                });
                reader.read().then(processText)
            })
        })
        .catch(error => {
            updateResponse(uniqueId, {
                // @ts-ignore
                response: `Error: ${err.message}`,
                error: true
            });
        })
    }

    const getGPTResult = async () => {
        // Get the prompt input
        const _prompt = props.initialPrompt;
    
        setIsLoading(true);
    
        let uniqueId: string;
        uniqueId = addResponse(false);
        await delay(50);
    
        try {
          // Send a POST request to the API with the prompt in the request body
          //const response = await
          const response = await axios({
            method: 'post',
            url: 'get-prompt-result', 
            data: {
                prompt: _prompt,
            },
            headers: {
                Accept: 'text/event-stream'
            },
            responseType: 'stream'
          });

          response.data.pipe((res: any) => {
            console.log('here', res)
          })

        //   const stream = response.data;

        //   stream.on('data', (data:any) => {
        //     console.log('here', data)
        //   })

        //   setIsLoading(false)
        //   updateResponse(uniqueId, {
        //     response: response.data.trim(),
        //   });
        } catch (err) {
          updateResponse(uniqueId, {
            // @ts-ignore
            response: `Error: ${err.message}`,
            error: true
          });
        } finally {
          // Clear the loader interval
          clearInterval(loadInterval);
          setIsLoading(false);
        }
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
                { !isLoading && (<>
                    <div className='chat-area'>
                        { !isLoading && (<div id="response-list">
                            <PromptResponseList responseList={responseList} key="response-list"/>
                        </div>)}
                    </div></>)}
                { isRespCompleted && (<>
                    <div className='input-area'>
                        <div className='input-container'>
                            <input type="text" placeholder={`Ask me about the ${props.title.toLowerCase()}...`}/>
                            <button type="submit"><FontAwesomeIcon icon={faMessage}/></button>
                        </div>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
}