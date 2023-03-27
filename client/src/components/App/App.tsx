import {useCallback, useState} from 'react';
import axios from "axios";
import PromptInput from "../PromptInput/PromptInput";
import './App.css';
import {ResponseInterface} from "../PromptResponseList/response-interface";
import PromptResponseList from "../PromptResponseList/PromptResponseList";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDoubleLeft, faClose, faBuilding, faChevronDown, faStar } from '@fortawesome/free-solid-svg-icons';
import { focusConfig } from './insight-info';
import { InsightCard } from '../InsightCard/InsightCard';

type ModelValueType = 'gpt' | 'codex' | 'image';
const App = () => {
  const [isShowing, setIsShowing] = useState(false);
  const [responseList, setResponseList] = useState<ResponseInterface[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  let loadInterval: number | undefined;


  const generateUniqueId = () => {
    const timestamp = Date.now();
    const randomNumber = Math.random();
    const hexadecimalString = randomNumber.toString(16);

    return `id-${timestamp}-${hexadecimalString}`;
  }

  const htmlToText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent;
  }

  const delay = (ms: number) => {
    return new Promise( resolve => setTimeout(resolve, ms) );
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
        updatedList[index] = {
          ...updatedList[index],
          ...updatedObject
        }
      }
      return updatedList;
    });
  }

  const clickHandler = useCallback(() => {
    setIsShowing(!isShowing);
    getGPTResult();
  }, [isShowing])

  const getGPTResult = async () => {
    // Get the prompt input
    const _prompt = 'Rystad Energy';

    setIsLoading(true);

    let uniqueId: string;
    uniqueId = addResponse(false);
    await delay(50);

    try {
      // Send a POST request to the API with the prompt in the request body
      const response = await axios.post('get-prompt-result', {
        prompt: _prompt,
      });
      setIsLoading(false)
      updateResponse(uniqueId, {
        response: response.data.trim(),
      });
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
    <div className='App'>
      <div className={`mock-area ${isShowing ? 'open' : 'closed'}`}>
        <div className='inner-mock-area'>
          <div className={`mock-btn ${(isShowing ? 'active' : '')}`} onClick={clickHandler}>
            <div className='icon-container'>
              {isShowing ? (
                <FontAwesomeIcon size={'xl'} icon={faClose}/>
              ) :
              (<FontAwesomeIcon size={'xl'} icon={faAngleDoubleLeft} />)}
            </div>
          </div>
          {isShowing && (<div className='mock-display-area'>
            <div className='panel-header'>
              <div className='account-label-wrapper label-font'>
                <div className='icon-container'>
                  <FontAwesomeIcon swapOpacity={true} size={'lg'} icon={faBuilding}/>
                </div>
                <div>
                  <span>Rystad Energy</span>
                </div>
              </div>
            </div>
            <div className='insight-label-header'>
              <span>Accounts Insight Dashboard</span>
              <div className='icon-container'>
                <FontAwesomeIcon size={'sm'} icon={faChevronDown}/>
              </div>
              <div className='icon-container'>
                <FontAwesomeIcon size={'sm'} icon={faStar}/>
              </div>
            </div>
            <div className={'card-area'}>
              { focusConfig.map(c => (<InsightCard {...c}/>)) }
              {/* <div className={'insight-card scroll-y'}>
                <div className='sugarcrm-loader'></div> */}
                {/* {isLoading && (<div className='sugarcrm-loader'></div>)}
                <div id="response-list">
                  <PromptResponseList responseList={responseList} key="response-list"/>
                </div> */}
              {/* </div> */}
              {/* <div className={'insight-card scroll-y'}>
                {isLoading && (<div className='sugarcrm-loader'></div>)}
                <div id="response-list">
                  <PromptResponseList responseList={responseList} key="response-list"/>
                </div>
              </div> */}
            </div>
            {/* <div className={'full-area scroll-y'}>
            {isLoading && (<div className='sugarcrm-loader'></div>)}
              <div id="response-list">
                <PromptResponseList responseList={responseList} key="response-list"/>
              </div>
            </div> */}
          </div>)}
        </div>
      </div>
    </div>
  );
}

export default App;
