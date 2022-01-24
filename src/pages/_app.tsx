import '../styles/globals.css'
import type { AppProps } from 'next/app'


if (typeof window !== 'undefined')
{
	/** Disable weird ios zoom */
	document.addEventListener('touchstart', (event) => 
	{
		if (event.touches.length > 1)
		{
			event.preventDefault();
		}
	},
	{
		passive: false
	});
}

function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default App
