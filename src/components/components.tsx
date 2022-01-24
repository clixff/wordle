import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Main.module.css'
import { FocusEvent } from 'react'
import Link from 'next/link';
import Image from 'next/image'


export function randomInteger(min: number, max: number): number 
{
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

export enum EAnimationType
{
    None,
    Input,
    Shake,
    Result
}

export enum ETileType
{
    Default,
    Gray,
    Yellow,
    Green
}

export interface IGameTileData
{
    letter: string,
    type: ETileType;
    animation: EAnimationType;
}

export type TileSet = Array<Array<IGameTileData>>;

export interface IKeyboardButton
{
    key: string;
    type: ETileType;
}

export type KeyboardSet = Array<Array<IKeyboardButton>>;


export function Navbar(): JSX.Element
{
    return (<div id={styles.navbar}> 
        <div id={styles['navbar-content']}>
            <Link href="/" passHref> 
                <div id={styles.logo}>
                    Endless Wordle
                </div>  
            </Link>
            <div id={styles['navbar-right']}>
                <a href="https://github.com/clixff/wordle" target="_blank" rel="noreferrer">
                    <button id={styles['github-btn']} tabIndex={-1}>
                        <IconGithub />
                    </button>
                </a>
            </div>
        </div>
    </div>)
}

interface IGameWrapperProps
{
    tileSet: TileSet;
    keyboard: KeyboardSet;
    generateNewWord: () => void;
    onVirtualKeyDown: (key: string) => void;
    setClearAnimation: ClearAnimFunc;
}

function getTileClassNameByType(type: ETileType): string
{
    switch (type) {
        case ETileType.Default:
            return styles['game-tile-default'];
        case ETileType.Gray:
            return styles['game-tile-gray'];
        case ETileType.Yellow:
            return styles['game-tile-yellow'];
        case ETileType.Green:
            return styles['game-tile-green'];
        default:
            return '';
    }
}

type ClearAnimFunc = (row: number, index: number, duration: number) => void;

function GameTile(props: { tile: IGameTileData, index: number, row: number, setClearAnimation: ClearAnimFunc }): JSX.Element
{
    const tileRef = useRef<HTMLDivElement>(null);
    const [animClassName, setAnimClassName] = useState('');

    useEffect(() =>
    {
        if (props.tile.animation == EAnimationType.None && animClassName.length)
        {
            setAnimClassName('');
            if (tileRef && tileRef.current)
            {
                tileRef.current.style.animationDelay = '0s';
            }
        }

        let animationDuration = 1000;
        switch (props.tile.animation) {
            case EAnimationType.Input:
                setAnimClassName(styles['game-tile-input']);
                animationDuration = 180;
                break;
            case EAnimationType.Shake:
                setAnimClassName(styles['game-tile-shake']);
                animationDuration = 100 + (props.index*60);
                if (tileRef && tileRef.current)
                {
                    tileRef.current.style.animationDelay = `${props.index*60}ms`;
                }
                break;
            case EAnimationType.Result:
                setAnimClassName(styles['game-tile-result']);
                animationDuration = 800 + ((props.index+0)*300);
                if (tileRef && tileRef.current)
                {
                    tileRef.current.style.animationDelay = `${(props.index + 0)*300}ms`;
                }
                break;
        }
        props.setClearAnimation(props.row, props.index, animationDuration);
    }, [props.tile.animation, animClassName.length, props])

    return (<div ref={tileRef} id={`game-tile-${props.row}-${props.index}`} className={`${styles['game-tile']} ${getTileClassNameByType(props.tile.type)} ${animClassName}`}>
        {
            props.tile.letter
        }
    </div>);
}

export function GameWrapper(props: IGameWrapperProps): JSX.Element
{
    function onClickGenerateNewWord()
    {
        
        props.generateNewWord();
    }

    function onFocusGenerateNewWord(event: FocusEvent<HTMLButtonElement>)
    {
        event.target.blur();
    }

    return (<div id={styles['game-content']}>
        <div id={styles['game-wrapper']}>
            <div id={styles['game-top-wrapper']}>
                <button id={styles['button-generate-new-word']} onClick={onClickGenerateNewWord} tabIndex={-1} onFocus={onFocusGenerateNewWord}>
                    Generate new word
                </button>
            </div>
            <div id={styles['game-grid']}>
                {
                    props.tileSet.map((tiles: Array<IGameTileData>, row) =>
                    {
                        return (<div key={`row-${row}`} className={styles['game-tiles-container']}> 
                            {
                                tiles.map((tile: IGameTileData, index) =>
                                {
                                    return <GameTile tile={tile} index={index} row={row} key={`tile-${index}`} setClearAnimation={props.setClearAnimation} />;
                                })
                            }
                        </div>);
                    })
                }
            </div>
        </div>

        <Keyboard keys={props.keyboard} onVirtualKeyDown={props.onVirtualKeyDown} />

    </div>);
}

function KeyboardButton(props: { btn: IKeyboardButton, onVirtualKeyDown: (btn: string) => void }): JSX.Element
{
    const btnRef = useRef<HTMLButtonElement>(null);
    function getClassNames(): string
    {
        let classNames = styles['keyboard-button']

        if (props.btn.key == 'Enter')
        {
            classNames += ` ${styles['keyboard-enter']}`;
        }

        if (props.btn.key == 'ERS')
        {
            classNames += ` ${styles['keyboard-erase']}`;
        }

        switch (props.btn.type) {
            case ETileType.Gray:
                classNames += ` ${styles['keyboard-gray']}`;
                break;
            case ETileType.Green:
                classNames += ` ${styles['keyboard-green']}`;
                break;
            case ETileType.Yellow:
                classNames += ` ${styles['keyboard-yellow']}`;
                break;
        }

        return classNames;
    }

    function onClick()
    {
        if (typeof props.onVirtualKeyDown === 'function')
        {
            props.onVirtualKeyDown(props.btn.key);
        }
    }

    function onFocus(event: FocusEvent<HTMLButtonElement>)
    {
        // event.target.blur();
        event.preventDefault();
        event.stopPropagation();
    }

    return (<button ref={btnRef} className={getClassNames()} onClick={onClick} tabIndex={-1} onFocus={onFocus}> 
        {
            props.btn.key == 'ERS' ?
            (
                <IconBackspace />
            ) :
            props.btn.key
        }
    </button>);
}

function Keyboard(props: {keys:  KeyboardSet, onVirtualKeyDown: (btn: string) => void}): JSX.Element
{
    return (<div id={styles['keyboard-set']}>
        {
            props.keys.map((keysRow: Array<IKeyboardButton>, index) =>
            {
                return (<div className={styles['keyboard-row']} key={index}> 
                    {
                        keysRow.map((btn, index) =>
                        {
                            return (<KeyboardButton btn={btn} key={index} onVirtualKeyDown={props.onVirtualKeyDown} />);
                        })
                    }
                </div>)
            })
        }
    </div>);
}

export function TopNotification(props: { text: string  }): JSX.Element
{
    return (<div id={styles['top-notification-wrapper']}>
        <div id={styles['top-notification-content']}>
            {
                props.text
            }
        </div>
    </div>);
}

interface IGameEndNotification
{
    bWin: boolean;
    word: string;
    generateNewWord: () => void;
    row: number;
    maxRows: number;
    tiles: TileSet;
}

export function GameEndNotification(props: IGameEndNotification): JSX.Element
{
    function onClickPlay()
    {
        props.generateNewWord();
    }

    function getTwitterText(): string
    {
        let str = '';

        str = '#endlessWordle #wordle'

        str += ` ${props.row+1}/${props.maxRows}\n`;
        str += `Word: ${props.word}\n\n`;

        for (let i = 0; i < props.row+1; i++)
        {
            for (let c of props.tiles[i])
            {
                switch (c.type) {
                    case ETileType.Green:
                        str += `🟩`;
                        break;
                    case ETileType.Yellow:
                        str += `🟨`;
                        break;
                    default:
                        str += '⬜';
                        break;
                }
            }
            str += '\n'
        }

        str += 'https://wordle-game.vercel.app/';

        return encodeURIComponent(str);
    }

    return (<div id={styles['game-end-wrapper']}>
        <div id={styles['game-end-bg']} />
        <div id={styles['game-end-modal']}>
            <div id={styles['game-end-container']}>
                <div id={styles['game-end-icon']}>
                    <Image src={props.bWin ? "/images/smile_face.png" : "/images/sad_face.png" } width={80} height={80} alt={""}/>
                </div>
                <div id={styles['game-end-title']}>
                    {
                       props.bWin ? 'Great!' : 'You almost guessed it!'
                    }
                </div>
                <div id={styles['game-end-word-was']}>
                    The word was:
                </div>
                <div id={styles['game-end-word']}>
                    {
                        props.word
                    }
                </div>
                <div id={styles['game-end-tiles']}>
                    {
                        props.tiles.map((row, index) =>
                        {
                            if (index > props.row)
                            {
                                return null
                            }
                            
                            return (<div key={index} className={styles['game-end-tiles-row']}>
                            {
                                row.map((tile, index) =>
                                {
                                    let classes = styles['game-end-tile'];
                                    if (tile.type == ETileType.Green)
                                    {
                                        classes += ` ${styles['game-end-tile-green']}`;
                                    }
                                    else if (tile.type == ETileType.Yellow)
                                    {
                                        classes += ` ${styles['game-end-tile-yellow']}`;
                                    }
    
                                    return (<div  key={index} className={classes}/>)
                                })
                            } 
                            </div>)
                        })
                    }
                </div>

                <div id={styles['game-end-buttons']}>
                    <a href={`https://twitter.com/intent/tweet?text=${getTwitterText()}`} target="_blank" rel="noreferrer"> 
                        <button id={styles['game-end-button-twitter']} >
                            <IcontTwitter />
                            Share On Twitter
                        </button>
                    </a>
                    <button id={styles['game-end-button-continue']} onClick={onClickPlay}>
                        Continue Playing
                    </button>
                </div>
            </div>
        </div>
    </div>);
}

export function IconGithub(): JSX.Element
{
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>);
}

export function IconBackspace(): JSX.Element
{
    return (<svg className={styles['icon-backspace']} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18.75 4a3.25 3.25 0 0 1 3.245 3.066L22 7.25v9.5a3.25 3.25 0 0 1-3.066 3.245L18.75 20h-8.501a3.25 3.25 0 0 1-2.085-.756l-.155-.139-4.995-4.75a3.25 3.25 0 0 1-.116-4.594l.116-.116 4.995-4.75a3.25 3.25 0 0 1 2.032-.888L10.25 4h8.501Zm0 1.5h-8.501a1.75 1.75 0 0 0-1.08.372l-.126.11-4.996 4.75-.062.062a1.75 1.75 0 0 0-.054 2.352l.116.122 4.996 4.75c.285.27.65.437 1.039.474l.167.008h8.501a1.75 1.75 0 0 0 1.744-1.607l.006-.143v-9.5a1.75 1.75 0 0 0-1.607-1.744L18.75 5.5Zm-7.304 2.897.084.073L14 10.939l2.47-2.47a.75.75 0 0 1 1.133.977l-.073.084L15.061 12l2.47 2.47a.75.75 0 0 1-.977 1.133l-.084-.073L14 13.061l-2.47 2.47a.75.75 0 0 1-1.133-.977l.073-.084L12.94 12l-2.47-2.47a.75.75 0 0 1 .976-1.133Z"/></svg>);
}

export function IcontTwitter(): JSX.Element
{
    return (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>);
}