import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Clock,
  FileUp,
  Grid3x3,
  Hash,
  Link as LinkIcon,
  List,
  Mail,
  Star,
  Sliders,
  ToggleLeft,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { FormQuestionType } from '@/types/hrModules';

// The one repeated shape every question type follows: a builder-mode config editor keyed off
// `configKind`, described once here rather than as 19 duplicated per-type files (see
// components/forms/QuestionEditor.tsx). 'grid' covers multiple_choice_grid/checkbox_grid — rows
// reuse the `options` list (relabeled), columns live in `config.columns: string[]`.
export type ConfigKind = 'none' | 'text' | 'choice' | 'file' | 'scale' | 'rating' | 'number' | 'grid';

export type QuestionTypeGroup = 'Text' | 'Choice' | 'Scale & Grid' | 'Date & Time' | 'File' | 'Layout';

export interface QuestionTypeUi {
  type: FormQuestionType;
  label: string;
  icon: LucideIcon;
  hasOptions: boolean;
  /** Layout-only types (section header / static text) carry no answer and no required toggle. */
  isLayout: boolean;
  configKind: ConfigKind;
  group: QuestionTypeGroup;
}

// All 19 types are enabled in the "Add question" picker (unlike the reference implementation this
// was ported from, which only shipped 10 live) — see plan simplification notes.
export const QUESTION_TYPES: QuestionTypeUi[] = [
  { type: 'short_answer', label: 'Short answer', icon: Type, hasOptions: false, isLayout: false, configKind: 'text', group: 'Text' },
  { type: 'paragraph', label: 'Paragraph', icon: AlignLeft, hasOptions: false, isLayout: false, configKind: 'text', group: 'Text' },
  { type: 'email', label: 'Email', icon: Mail, hasOptions: false, isLayout: false, configKind: 'none', group: 'Text' },
  { type: 'url', label: 'Website', icon: LinkIcon, hasOptions: false, isLayout: false, configKind: 'none', group: 'Text' },
  { type: 'number', label: 'Number', icon: Hash, hasOptions: false, isLayout: false, configKind: 'number', group: 'Text' },
  { type: 'multiple_choice', label: 'Multiple choice', icon: List, hasOptions: true, isLayout: false, configKind: 'choice', group: 'Choice' },
  { type: 'checkboxes', label: 'Checkboxes', icon: CheckSquare, hasOptions: true, isLayout: false, configKind: 'choice', group: 'Choice' },
  { type: 'dropdown', label: 'Dropdown', icon: ChevronDown, hasOptions: true, isLayout: false, configKind: 'choice', group: 'Choice' },
  { type: 'yes_no', label: 'Yes / No', icon: ToggleLeft, hasOptions: false, isLayout: false, configKind: 'none', group: 'Choice' },
  { type: 'linear_scale', label: 'Linear scale', icon: Sliders, hasOptions: false, isLayout: false, configKind: 'scale', group: 'Scale & Grid' },
  { type: 'rating', label: 'Rating', icon: Star, hasOptions: false, isLayout: false, configKind: 'rating', group: 'Scale & Grid' },
  { type: 'multiple_choice_grid', label: 'Multiple choice grid', icon: Grid3x3, hasOptions: false, isLayout: false, configKind: 'grid', group: 'Scale & Grid' },
  { type: 'checkbox_grid', label: 'Checkbox grid', icon: Grid3x3, hasOptions: false, isLayout: false, configKind: 'grid', group: 'Scale & Grid' },
  { type: 'date', label: 'Date', icon: Calendar, hasOptions: false, isLayout: false, configKind: 'none', group: 'Date & Time' },
  { type: 'time', label: 'Time', icon: Clock, hasOptions: false, isLayout: false, configKind: 'none', group: 'Date & Time' },
  { type: 'datetime', label: 'Date & time', icon: Calendar, hasOptions: false, isLayout: false, configKind: 'none', group: 'Date & Time' },
  { type: 'file_upload', label: 'File upload', icon: FileUp, hasOptions: false, isLayout: false, configKind: 'file', group: 'File' },
  { type: 'section_header', label: 'Section header', icon: Type, hasOptions: false, isLayout: true, configKind: 'none', group: 'Layout' },
  { type: 'rich_text', label: 'Description', icon: AlignLeft, hasOptions: false, isLayout: true, configKind: 'none', group: 'Layout' },
];

export const QUESTION_TYPE_GROUPS: QuestionTypeGroup[] = ['Text', 'Choice', 'Scale & Grid', 'Date & Time', 'File', 'Layout'];

const QUESTION_TYPE_BY_VALUE: Map<FormQuestionType, QuestionTypeUi> = new Map(QUESTION_TYPES.map((t) => [t.type, t]));

export const questionTypeUi = (type: string): QuestionTypeUi =>
  QUESTION_TYPE_BY_VALUE.get(type as FormQuestionType) ?? (QUESTION_TYPES[0] as QuestionTypeUi);
