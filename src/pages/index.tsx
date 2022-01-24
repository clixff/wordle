import React from 'react'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { TileSet, Navbar, IGameTileData, ETileType, GameWrapper, randomInteger, KeyboardSet, IKeyboardButton, TopNotification, EAnimationType, GameEndNotification } from '../components/components'
import styles from '../styles/Main.module.css'

interface IWordsList
{
	[length: string]: Array<string>
};

interface IGameState
{
	tiles: TileSet;
	words: IWordsList;
	word: string;
	wordLength: number;
	rowsCount: number;
	keyboardSet: KeyboardSet;
	currentRow: number;
	notificationText: string,
	bGameEnded: boolean,
	bWin: boolean
};

class Game extends React.Component<{}, IGameState>
{
	notificationTimer: null | NodeJS.Timeout = null;
	animationTimeouts: Map<string, NodeJS.Timeout> = new Map();
	constructor(props: {})
	{
		super(props);
		this.state = {
			tiles: [ [] ],
			words: {},
			word: '',
			wordLength: -1,
			rowsCount: 6,
			keyboardSet: [],
			currentRow: 0,
			notificationText: '',
			bGameEnded: false,
			bWin: false
		};

		this.generateNewWord = this.generateNewWord.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onNewKeyPressed = this.onNewKeyPressed.bind(this);
		this.fetchWords = this.fetchWords.bind(this);
		this.onVirtualKeyDown = this.onVirtualKeyDown.bind(this);
		this.setClearAnimation = this.setClearAnimation.bind(this);
		this.onGenerateNewWordClick = this.onGenerateNewWordClick.bind(this);
	}

	clearKeyboard()
	{
		const keys: Array<string> = [
			'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'
		];

		const newKeyboardSet: KeyboardSet = [];

		for (let str of keys)
		{
			const keyboardRow: Array<IKeyboardButton> = [];
			for (let i = 0; i < str.length; i++)
			{
				keyboardRow.push({ type: ETileType.Default, key: `${str[i]}` });
			}
			newKeyboardSet.push(keyboardRow);
		}

		newKeyboardSet[2].unshift({ key: 'ERS', 'type': ETileType.Default });
		newKeyboardSet[2].push({ key: 'Enter', 'type': ETileType.Default });

		this.setState({
			keyboardSet: newKeyboardSet
		});
	};

	clearTiles(letters: number = 5, tries: number = 6)
	{
		const newTiles: TileSet = [];
		for (let i = 0; i < tries; i++)
		{
			const lettersArr: Array<IGameTileData> = new Array(letters);
			for (let j = 0; j < letters; j++)
			{
				// lettersArr[j] = { letter: String.fromCharCode(randomInteger(65, 90)), type: randomInteger(0, 3) };
				lettersArr[j] = { letter: '', type: ETileType.Default, animation: EAnimationType.None };
			}
			newTiles.push(lettersArr);
		}
		this.setState({
			tiles: newTiles
		});
	};

	fetchWords(): Promise<void>
	{
		const callback = async (resolve: any) =>
		{
			try
			{
				const res = await fetch(`/words.json`);
				const jsonRes = await res.json();
	
				const wordsObject: IWordsList = {};
	
				for (let key in jsonRes)
				{
					wordsObject[key] = jsonRes[key].split(' ');
				}

	
				this.setState({
					words: wordsObject
				},  resolve);
			}
			catch (err)
			{
				console.error(err);
			}
		};

		return new Promise(callback);
	}

	generateNewWord()
	{
		const minLength = 4;
		const maxLength = 6;

		let newWordLength = this.state.wordLength;

		if (newWordLength == -1)
		{
			newWordLength = randomInteger(minLength, maxLength);
		}

		this.clearTiles(newWordLength, this.state.rowsCount);
		this.clearKeyboard();

		const wordsList = this.state.words[`${newWordLength}`] || [];
		const newWord = wordsList.length ? wordsList[randomInteger(0, wordsList.length - 1)] : '' ;
		console.log(`New word is ${newWord}` );
		this.setState({
			word: newWord,
			currentRow: 0,
			bGameEnded: false,
			bWin: false
		});

		const animationTimers = Array.from(this.animationTimeouts.values());

		for (let timer of animationTimers)
		{
			clearTimeout(timer);
		};

		this.animationTimeouts.clear();
	}

	getLetterTypeByIndex(letter: string, index: number): ETileType
	{
		letter = letter.toLowerCase();

		const foundIndex = this.state.word.search(letter);

		if (foundIndex == -1)
		{
			return ETileType.Gray;
		}
		else if (foundIndex == index)
		{
			return ETileType.Green;
		}
		else
		{
			return ETileType.Yellow;
		}
	}

	updateKeyboard()
	{
		this.setState((prevState) =>
		{
			const row = prevState.currentRow-1;

			if (prevState.bGameEnded)
			{
				return {
					keyboardSet: prevState.keyboardSet
				};
			}

			for (let kRow of prevState.keyboardSet)
			{
				for (let key of kRow)
				{
					for (let i = 0; i < prevState.tiles[row].length; i++)
					{
						const char = prevState.tiles[row][i];

						if (char.letter.toLowerCase() == key.key.toLowerCase() && char.type > key.type)
						{
							key.type = char.type;
							break;
						}
					}
				}
			}

			return {
				keyboardSet: prevState.keyboardSet
			};
		});
	}

	onNewKeyPressed(char: string)
	{
		if (typeof char != 'string' || char.length != 1)
		{
			return;
		}
		
		char = char.toLowerCase();

		if (!char.trim())
		{
			return;
		}

		const row = this.state.tiles[this.state.currentRow];
		if (!row)
		{
			return;
		}

		for (let i = 0; i < row.length; i++)
		{
			const tile = row[i];
			if (!tile.letter.trim())
			{
				tile.letter = char.toUpperCase();
				tile.animation = EAnimationType.Input;
				// this.playTileInputAnimation(i);

				this.setState({
					tiles: this.state.tiles
				});

				return;
			}
		}
	}

	eraseChar()
	{
		const row = this.state.tiles[this.state.currentRow];
		if (!row)
		{
			return;
		}

		let charIndex = 0;

		for (let i = 0; i < row.length; i++)
		{
			if (row[i].letter.trim())
			{
				charIndex = i;
			}
		}


		if (charIndex > -1)
		{
			row[charIndex].letter = '';
			row[charIndex].animation = EAnimationType.Input;
			this.setState({
				tiles: this.state.tiles
			});
		}
	}

	onEnterPressed()
	{
		let word = '';

		for (let char of this.state.tiles[this.state.currentRow])
		{
			word = `${word}${char.letter}`;
		}

		word = word.trim().toLowerCase();

		if (word.length != this.state.word.length)
		{
			this.showNotification('Not enough characters');
			this.playAnimationAllRow(this.state.currentRow, EAnimationType.Shake);
			return;
		}

		if (!this.state.words[`${word.length}`].includes(word))
		{
			this.showNotification('This word is not in the words list');
			this.playAnimationAllRow(this.state.currentRow, EAnimationType.Shake);
			return;
		}

		this.setState((prevState) =>
		{
			for (let i = 0; i < word.length; i++)
			{
				const char = prevState.tiles[prevState.currentRow][i];
				char.type = this.getLetterTypeByIndex(char.letter, i);
				char.animation = EAnimationType.Result;
			}

			let bWin = false;
			let bGameEnded = false;

			if (word == this.state.word)
			{
				bWin = true;
			}

			let newRow = prevState.currentRow + 1;

			if (bWin || newRow >= prevState.rowsCount)
			{
				newRow--;
				bGameEnded = true;
			}

			return {
				currentRow: newRow,
				tiles: prevState.tiles,
				bGameEnded: bGameEnded,
				bWin: bWin
			}
		}, () =>
		{
			this.updateKeyboard();
		});
	}

	onKeyDown(event: KeyboardEvent)
	{
		if (this.state.bGameEnded)
		{
			return;
		}

		if (event.code.length == 4 && event.code.startsWith('Key'))
		{
			const char = event.code[3].toLowerCase();
			this.onNewKeyPressed(char);
		}
		else if (event.code == 'Backspace')
		{
			this.eraseChar();
		}
		else if (event.code == 'Enter' && (!document.activeElement || document.activeElement == document.body))
		{
			this.onEnterPressed();
		}
	}

	onVirtualKeyDown(key: string)
	{
		if (this.state.bGameEnded)
		{
			return;
		}

		switch (key) {
			case 'ERS':
				this.eraseChar();
				break;
			case 'Enter':
				this.onEnterPressed();
				break;
			default:
				this.onNewKeyPressed(key);
				break;
		}
	}

	setClearAnimation(row: number, index: number, duration: number)
	{
		const key = `${row}-${index}`;
		const oldTimeout = this.animationTimeouts.get(key);
		if (oldTimeout)
		{
			clearTimeout(oldTimeout);
		}

		this.animationTimeouts.set(key, setInterval(() =>
		{
			this.setState((prevState) =>
			{
				prevState.tiles[row][index].animation = EAnimationType.None;

				return {
					tiles: prevState.tiles
				};
			});
		}, duration));
	}

	playAnimationAllRow(row: number, animation: EAnimationType)
	{
		this.setState((prevState) =>
		{
			for (let char of prevState.tiles[row])
			{
				char.animation = animation;
			}
			
			return {
				tiles: prevState.tiles
			}
		});
	}
	
	showNotification(text: string)
	{
		this.setState({
			notificationText: text
		});

		this.clearNotificationTimer();

		this.notificationTimer = setTimeout(() =>
		{
			this.setState({
				notificationText: ''
			});
			this.clearNotificationTimer();

		}, 2000);
	}

	clearNotificationTimer()
	{
		if (this.notificationTimer)
		{
			clearTimeout(this.notificationTimer);
			this.notificationTimer = null;
		}
	}

	componentDidMount()
	{
		this.fetchWords().then(() =>
		{
			this.generateNewWord();
		});

		if (typeof window != 'undefined')
		{
			document.addEventListener('keydown', this.onKeyDown);
		}
	}

	componentWillUnmount()
	{
		if (typeof window != 'undefined')
		{
			document.removeEventListener('keydown', this.onKeyDown);
		}

		this.clearNotificationTimer();
	}

	onGenerateNewWordClick()
	{
		if (this.state.currentRow == 0)
		{
			this.generateNewWord();
		}
		else
		{
			this.setState((prevState) =>
			{
				return {
					bGameEnded: true,
					currentRow: prevState.currentRow - 1
				}
			});
		}
	}

	render()
	{
		return (
			<div className={styles.container}>
			<Head>
				<title>Wordle — Endless Clone</title>
				<meta name="description" content="Guess the wordle in this endless game" />
				<link rel="icon" href="/favicon.ico" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
			</Head>
			{
				this.state.bGameEnded ?
					<GameEndNotification bWin={this.state.bWin} word={this.state.word} generateNewWord={this.generateNewWord} row={this.state.currentRow} maxRows={this.state.rowsCount} tiles={this.state.tiles} />
				: null
			}
			{
				this.state.notificationText ? (
					<TopNotification text={this.state.notificationText} />
				) : null
			}
			<Navbar />
			<GameWrapper tileSet={this.state.tiles} keyboard={this.state.keyboardSet} generateNewWord={this.onGenerateNewWordClick} onVirtualKeyDown={this.onVirtualKeyDown} setClearAnimation={this.setClearAnimation} />
			</div>
		);
	}
}


export default Game;
