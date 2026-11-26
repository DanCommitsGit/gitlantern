// The lantern from build/logo.svg without its tile. The branch takes the title bar's background color.
export function LogoMark(): React.JSX.Element {
    return (
        <svg className="h-6 w-4 flex-none" viewBox="15 6 34 51" aria-hidden="true">
            <path
                className="fill-logo-frame"
                d="M24 17v-2a8 8 0 0 1 16 0v2h-4v-2a4 4 0 0 0-8 0v2zM17 24l6-8h18l6 8z"
            />
            <rect className="fill-logo-frame" x="17" y="50" width="30" height="6" rx="1.5" />
            <path className="fill-logo-glass" d="M20 26h24l-3 22H23z" />
            <path
                className="stroke-sunken"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                d="M28 31V43M28 42C28 37 37 39 37 34"
            />
            <g className="fill-sunken">
                <circle cx="28" cy="31" r="3.2" />
                <circle cx="28" cy="43" r="3.2" />
                <circle cx="37" cy="34" r="3.2" />
            </g>
        </svg>
    )
}
