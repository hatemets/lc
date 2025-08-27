type Msg = {
    id: string;
    parentId?: string;
    sender: 'Buyer' | 'Seller';
    ts: number; // unix-like timestamp
    text: string;
};

type ThreadNode = { msg: Msg; children: ThreadNode[] };

// helper: format timestamp -> HH:MM
const formatTime = (ts: number): string => {
    const date = new Date(ts * 1000);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

// function stub: implement sorting + rendering
const renderChrono = (msgs: Msg[]): string => {
    // TODO: sort messages chronologically
    // TODO: render as "HH:MM sender: text"
    const sorted = msgs.sort((a, b) => b.ts - a.ts);
    let result = '';
    for (const msg of sorted) {
        result += `${formatTime(msg.ts)} ${msg.sender}: ${msg.text}\n`;
    }
    return result;
};

// 1) return all messages from a given sender
const getBySender = (msgs: Msg[], sender: 'Buyer' | 'Seller'): Msg[] => {
    return msgs.filter((msg) => msg.sender === sender);
};

// 2) return messages in a time range [start, end]
const getInRange = (msgs: Msg[], start: number, end: number): Msg[] => {
    return msgs.filter((msg) => msg.ts > start && msg.ts < end);
};

// 3) find a message by id and show its context (previous & next chronologically)
const getWithContext = (msgs: Msg[], id: string): { prev?: Msg; current?: Msg; next?: Msg } => {
    const sorted = msgs.sort((a, b) => a.ts - b.ts);
    const msgIdx = sorted.findIndex((msg) => msg.id === id);
    const result: { prev?: Msg; current?: Msg; next?: Msg } = {};

    if (msgIdx === -1) {
        return {};
    } else {
        result.current = sorted[msgIdx];

        const idx1 = msgIdx - 1;
        if (idx1 >= 0) {
            result.prev = sorted[idx1];
        }

        const idx2 = msgIdx + 1;
        if (idx2 < msgs.length) {
            result.next = sorted[idx2];
        }
    }

    return result;
};

const getMsgWithinTimeRange = (msgs: Msg[], start: number, end: number): Msg[] =>
    msgs.filter((m) => m.ts > start && m.ts < end).sort((a, b) => b.ts - a.ts);

type Tree = { roots: ThreadNode[]; orphans: Msg[] };

const buildThreads = (msgs: Msg[]): Tree => {
    const tree: Tree = {
        roots: [],
        orphans: []
    };

    const nodes: Map<string, ThreadNode> = new Map();
    const ids = new Set(msgs.map((m) => m.id));

    for (const msg of msgs) {
        nodes.set(msg.id, { msg, children: [] });
    }

    for (const m of msgs) {
        const node = nodes.get(m.id)!;

        if (m.parentId === null) {
            tree.roots.push(node);
            continue;
        }

        if (!ids.has(m.parentId as string) || m.parentId === m.id) {
            tree.orphans.push(node.msg);
            continue;
        }

        const parent = nodes.get(m.parentId as string);
        parent?.children.push(node);
    }

    return tree;
};

// --- extended dummy messages for buildThreads testing ---
const dummy: Msg[] = [
    // roots (no parentId)
    { id: '1', sender: 'Buyer', ts: 1000, text: 'Hi' },
    { id: '6', sender: 'Buyer', ts: 1005, text: 'Second thread root' },
    { id: '12', sender: 'Seller', ts: 990, text: 'Early separate root' },

    // replies to "1"
    { id: '2', sender: 'Seller', ts: 1010, parentId: '1', text: 'Hello' },
    { id: '3', sender: 'Buyer', ts: 1020, parentId: '1', text: 'Offer 90' },
    { id: '9', sender: 'Buyer', ts: 1025, parentId: '2', text: 'Question' },

    // deeper nesting under "3"
    { id: '4', sender: 'Seller', ts: 1030, parentId: '3', text: 'Counter 110' },
    { id: '5', sender: 'Buyer', ts: 1040, parentId: '4', text: 'Meet 100' },
    { id: '10', sender: 'Buyer', ts: 1035, parentId: '3', text: 'Clarify' },

    // replies to "6"
    { id: '7', sender: 'Seller', ts: 1015, parentId: '6', text: 'Reply' },
    { id: '11', sender: 'Buyer', ts: 1060, parentId: '7', text: 'Follow-up on second thread' },

    // orphan: parentId not present in dataset
    { id: '8', sender: 'Buyer', ts: 1050, parentId: '999', text: 'Orphan' },

    // out-of-order parent appears after a child that references it
    { id: '14', sender: 'Seller', ts: 1075, parentId: '13', text: 'Reply to late parent' },
    { id: '13', sender: 'Buyer', ts: 1070, text: 'Late parent arrives here' },

    // sibling replies to "12"
    { id: '15', sender: 'Buyer', ts: 995, parentId: '12', text: 'Ping on early root' },
    { id: '16', sender: 'Seller', ts: 1002, parentId: '12', text: 'Pong on early root' },

    // deeper chain off "15"
    { id: '17', sender: 'Buyer', ts: 1003, parentId: '15', text: 'Drilling down' },
    { id: '18', sender: 'Seller', ts: 1004, parentId: '17', text: 'And further' }
];

// console.log(getBySender(dummy, 'Buyer'));
// console.log(getInRange(dummy, 1005, 1025));
// console.log(getWithContext(dummy, '3'));
// console.log(getMsgWithinTimeRange(dummy, 1005, 1025));
console.log(buildThreads(dummy));
