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
  let loadInterval: number | undefined;

  const htmlToText = (html: string) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent;
  }

  const clickHandler = useCallback(() => {
    setIsShowing(!isShowing);
  }, [isShowing])

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
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
}

export default App;
