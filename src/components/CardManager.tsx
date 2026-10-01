import React, { useState } from 'react';
import { CardData, PayStatusType, ButtonType, INITIAL_CARDS, getCardBgImage } from '../types';
import {
  CreditCard,
  Plus,
  Trash2,
  Copy,
  Edit3,
  CheckCircle2,
  Clock,
  Sparkles,
  RotateCcw,
  Layers,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface CardManagerProps {
  cards: CardData[];
  onCardsChange: (newCards: CardData[]) => void;
  activeCardId?: string;
  onSelectCard?: (id: string) => void;
}

const BANK_PRESETS = [
  {
    bankName: 'ICICI Bank',
    bgImage: '/cards/icici_vertical.png',
    accentColor: '#c2410c',
    defaultStatus: 'Due in 7 days',
    defaultStatusType: 'due' as PayStatusType,
    defaultAmount: '₹42,000',
    defaultText: 'You can save ₹30 with POPcoins',
    defaultButton: 'pay' as ButtonType,
    defaultBtnLabel: 'Pay',
  },
  {
    bankName: 'Kotak Mahindra',
    bgImage: '/cards/kotak_vertical.png',
    accentColor: '#b91c1c',
    defaultStatus: 'Due on 15 days',
    defaultStatusType: 'due' as PayStatusType,
    defaultAmount: '₹42,000',
    defaultText: 'You can save ₹30 with POPcoins',
    defaultButton: 'pay' as ButtonType,
    defaultBtnLabel: 'Pay',
  },
  {
    bankName: 'HDFC Bank',
    bgImage: '/cards/hdfc_vertical.png',
    accentColor: '#1d4ed8',
    defaultStatus: 'Paid',
    defaultStatusType: 'paid' as PayStatusType,
    defaultAmount: '',
    defaultText: '₹20,000 marked paid today',
    defaultButton: 'refresh' as ButtonType,
    defaultBtnLabel: 'Refresh',
  },
  {
    bankName: 'SBI',
    bgImage: '/cards/sbi_vertical.png',
    accentColor: '#1e3a8a',
    defaultStatus: 'Paid',
    defaultStatusType: 'paid' as PayStatusType,
    defaultAmount: '',
    defaultText: '₹20,000 marked paid today',
    defaultButton: 'refresh' as ButtonType,
    defaultBtnLabel: 'Refresh',
  },
];

export const CardManager: React.FC<CardManagerProps> = ({
  cards,
  onCardsChange,
  activeCardId,
  onSelectCard,
}) => {
  const [editingCardId, setEditingCardId] = useState<string | null>(cards[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'editor' | 'list'>('editor');

  const editingCard = cards.find((c) => c.id === editingCardId) || cards[0];

  const updateCardField = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    if (!editingCard) return;
    const updated = cards.map((card) =>
      card.id === editingCard.id ? { ...card, [field]: value } : card
    );
    onCardsChange(updated);
  };

  const handleAddNewCard = (presetIndex = 0) => {
    const preset = BANK_PRESETS[presetIndex % BANK_PRESETS.length];
    const newId = `card-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
    const randomCardDigits = Math.floor(1000 + Math.random() * 9000);

    const newCard: CardData = {
      id: newId,
      bankName: preset.bankName,
      cardNo: `.. ${randomCardDigits}`,
      name: editingCard ? editingCard.name : 'Anushka Shah',
      amount: preset.defaultAmount,
      amountText: preset.defaultText,
      payStatus: preset.defaultStatus,
      payStatusType: preset.defaultStatusType,
      buttonType: preset.defaultButton,
      buttonLabel: preset.defaultBtnLabel,
      bgImage: preset.bgImage,
      accentColor: preset.accentColor,
    };

    const nextList = [...cards, newCard];
    onCardsChange(nextList);
    setEditingCardId(newId);
    if (onSelectCard) onSelectCard(newId);
  };

  const handleDuplicateCard = (card: CardData) => {
    const dupId = `card-dup-${Date.now().toString(36)}`;
    const duplicated: CardData = {
      ...card,
      id: dupId,
      cardNo: `.. ${Math.floor(1000 + Math.random() * 9000)}`,
    };
    onCardsChange([...cards, duplicated]);
    setEditingCardId(dupId);
  };

  const handleDeleteCard = (id: string) => {
    if (cards.length <= 1) {
      alert('You must have at least one card in the carousel.');
      return;
    }
    const filtered = cards.filter((c) => c.id !== id);
    onCardsChange(filtered);
    if (editingCardId === id) {
      setEditingCardId(filtered[0].id);
    }
  };

  const handleResetDefaults = () => {
    onCardsChange(INITIAL_CARDS);
    setEditingCardId(INITIAL_CARDS[0].id);
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800/80 rounded-2xl p-5 backdrop-blur-xl shadow-2xl flex flex-col h-full text-neutral-100">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight text-white">Card Manager & Editor</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            {cards.length} cards in loop • Edit variables in real-time
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'editor'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Edit Card
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'list'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            All Cards ({cards.length})
          </button>
        </div>
      </div>

      {/* Quick Bank Presets to Add */}
      <div className="py-3 border-b border-neutral-800/60">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            Quick Add Bank Card
          </span>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-[11px] text-neutral-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" /> Reset 4 Cards
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {BANK_PRESETS.map((preset, idx) => (
            <button
              key={preset.bankName}
              type="button"
              onClick={() => handleAddNewCard(idx)}
              className="group flex flex-col items-center p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/80 hover:border-neutral-600 transition-all text-center"
            >
              <div
                className="w-full h-8 rounded-md mb-1 bg-cover bg-center border border-neutral-700/50 shadow-inner group-hover:scale-[1.02] transition-transform"
                style={{ backgroundImage: `url(${preset.bgImage})` }}
              />
              <span className="text-[10px] font-medium text-neutral-300 truncate w-full">
                + {preset.bankName.replace(' Bank', '')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 custom-scrollbar">
        {activeTab === 'editor' && editingCard && (
          <div className="space-y-4">
            {/* Card selector pill bar */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {cards.map((card, i) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => {
                    setEditingCardId(card.id);
                    if (onSelectCard) onSelectCard(card.id);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all border ${
                    card.id === editingCard.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-semibold'
                      : 'bg-neutral-950/60 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: card.accentColor }}
                  />
                  <span>
                    #{i + 1} {card.bankName}
                  </span>
                </button>
              ))}
            </div>

            {/* Live Mini Preview (Clean card graphic - no overlaid text) */}
            <div className="flex justify-center py-1">
              <div
                className="relative w-[190px] rounded-xl overflow-hidden border border-neutral-700/60 shadow-lg"
                style={{
                  backgroundImage: `url(${getCardBgImage(editingCard.bgImage, 'vertical')})`,
                  aspectRatio: '621 / 1107',
                  backgroundSize: '100% 100%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>

            {/* Variable Edit Fields */}
            <div className="space-y-3.5 bg-neutral-950/80 p-4 rounded-xl border border-neutral-800">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Variables on Card
              </div>

              {/* Card Unique ID (Readonly + Badge) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Unique Card ID
                  </label>
                  <input
                    type="text"
                    value={editingCard.id}
                    disabled
                    className="w-full bg-neutral-900/80 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-neutral-400 font-mono cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={editingCard.bankName}
                    onChange={(e) => updateCardField('bankName', e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Variable 1: Card No. & Variable 4: Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Card No. (e.g. .. 1590)
                  </label>
                  <input
                    type="text"
                    value={editingCard.cardNo}
                    onChange={(e) => updateCardField('cardNo', e.target.value)}
                    placeholder=".. 1590"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Name (Cardholder)
                  </label>
                  <input
                    type="text"
                    value={editingCard.name}
                    onChange={(e) => updateCardField('name', e.target.value)}
                    placeholder="Anushka Shah"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Variable 2: Pay Status & Pay Status Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Pay Status (Text)
                  </label>
                  <input
                    type="text"
                    value={editingCard.payStatus}
                    onChange={(e) => updateCardField('payStatus', e.target.value)}
                    placeholder="Due in 7 days / Paid"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Status Style
                  </label>
                  <select
                    value={editingCard.payStatusType}
                    onChange={(e) =>
                      updateCardField('payStatusType', e.target.value as PayStatusType)
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="due">Amber (Due)</option>
                    <option value="paid">Emerald (Paid)</option>
                    <option value="overdue">Red (Overdue)</option>
                    <option value="pending">Blue (Pending)</option>
                  </select>
                </div>
              </div>

              {/* Variable 5: Amount & Variable 6: Amount Subtext */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={editingCard.amount}
                    onChange={(e) => updateCardField('amount', e.target.value)}
                    placeholder="₹42,000"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Amount Text
                  </label>
                  <input
                    type="text"
                    value={editingCard.amountText}
                    onChange={(e) => updateCardField('amountText', e.target.value)}
                    placeholder="You can save ₹30 with POPcoins"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Variable 3: Button (Paid / Refresh / Pay) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Button Action / Style
                  </label>
                  <select
                    value={editingCard.buttonType}
                    onChange={(e) => updateCardField('buttonType', e.target.value as ButtonType)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pay">Pay (Light Pill Button)</option>
                    <option value="refresh">Refresh (Dark Pill Button)</option>
                    <option value="paid">Paid (Marked Pill)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Button Label Text
                  </label>
                  <input
                    type="text"
                    value={editingCard.buttonLabel || ''}
                    onChange={(e) => updateCardField('buttonLabel', e.target.value)}
                    placeholder={editingCard.buttonType === 'pay' ? 'Pay' : 'Refresh'}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Background Image Selection & Accent Glow */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Card Background Template
                  </label>
                  <select
                    value={editingCard.bgImage}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCardField('bgImage', val);
                      // also update suggested accent color
                      const matchingPreset = BANK_PRESETS.find((p) => p.bgImage === val);
                      if (matchingPreset) {
                        updateCardField('accentColor', matchingPreset.accentColor);
                      }
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {BANK_PRESETS.map((preset) => (
                      <option key={preset.bankName} value={preset.bgImage}>
                        {preset.bankName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                    Ambient Glow Tint
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingCard.accentColor}
                      onChange={(e) => updateCardField('accentColor', e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={editingCard.accentColor}
                      onChange={(e) => updateCardField('accentColor', e.target.value)}
                      className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1 text-xs text-white font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <button
                  type="button"
                  onClick={() => handleDuplicateCard(editingCard)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteCard(editingCard.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Card
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="space-y-2.5">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                onClick={() => {
                  setEditingCardId(card.id);
                  if (onSelectCard) onSelectCard(card.id);
                }}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  card.id === editingCard?.id
                    ? 'bg-neutral-800/90 border-emerald-500/50 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-7.5 rounded bg-cover bg-center border border-neutral-700 shrink-0"
                    style={{ backgroundImage: `url(${card.bgImage})` }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{card.bankName}</span>
                      <span className="text-[10px] text-neutral-400 font-mono">{card.cardNo}</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                      <span>{card.name}</span>
                      <span>•</span>
                      <span className="text-white font-medium">{card.amount}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      card.payStatusType === 'paid'
                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                        : 'text-amber-400 bg-amber-950/40 border border-amber-800/40'
                    }`}
                  >
                    {card.payStatus}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingCardId(card.id);
                      setActiveTab('editor');
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCard(card.id);
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => handleAddNewCard(cards.length % BANK_PRESETS.length)}
              className="w-full py-2.5 border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white flex items-center justify-center gap-2 transition-colors mt-3"
            >
              <Plus className="w-4 h-4" /> Add Another Card to Infinite Loop
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
