import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CheckSquare,
  Square,
  MinusSquare,
  Search,
  ListFilter,
  Check,
  FolderOpen,
  ListMusic,
  ChevronDown,
  ChevronRight,
  Music
} from 'lucide-react';
import { Playlist, PlaylistNode } from '../types';
import { useI18n } from '../i18n/LanguageContext';

interface PlaylistFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: Playlist[];
  playlistTree?: PlaylistNode[];
  selectedPlaylistIds: string[];
  onSaveFilter: (selectedIds: string[]) => void;
}

/**
 * Get all playlist IDs from a node and its descendants
 */
function getAllPlaylistIds(node: PlaylistNode): string[] {
  if (node.type === 'playlist' && node.playlistId) {
    return [node.playlistId];
  }
  if (node.type === 'folder' && node.children) {
    return node.children.flatMap(child => getAllPlaylistIds(child));
  }
  return [];
}

/**
 * Build fallback tree nodes if no playlistTree is provided
 */
function getTreeNodes(playlists: Playlist[], playlistTree?: PlaylistNode[]): PlaylistNode[] {
  if (playlistTree && playlistTree.length > 0) {
    return playlistTree;
  }
  return playlists.map(pl => ({
    id: pl.id,
    name: pl.name,
    type: 'playlist',
    playlistId: pl.id,
    trackCount: pl.trackCount,
    trackIds: pl.trackIds,
  }));
}

/**
 * Filter tree nodes based on search query
 */
function filterTreeNode(node: PlaylistNode, query: string): PlaylistNode | null {
  const q = query.toLowerCase().trim();
  if (!q) return node;

  if (node.type === 'playlist') {
    return node.name.toLowerCase().includes(q) ? node : null;
  }

  if (node.type === 'folder') {
    const nameMatches = node.name.toLowerCase().includes(q);
    if (nameMatches) return node;

    if (node.children) {
      const filteredChildren = node.children
        .map(child => filterTreeNode(child, q))
        .filter((child): child is PlaylistNode => child !== null);

      if (filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
    }
  }

  return null;
}

/**
 * Recursive Tree Node Renderer Component
 */
const TreeNodeItem: React.FC<{
  node: PlaylistNode;
  level: number;
  tempSelected: Set<string>;
  collapsedFolderIds: Set<string>;
  onToggleFolderCollapse: (folderId: string) => void;
  onToggleNodeSelect: (node: PlaylistNode) => void;
}> = ({
  node,
  level,
  tempSelected,
  collapsedFolderIds,
  onToggleFolderCollapse,
  onToggleNodeSelect,
}) => {
  const { t } = useI18n();

  if (node.type === 'folder') {
    const isCollapsed = collapsedFolderIds.has(node.id);
    const childPlaylistIds = getAllPlaylistIds(node);
    const selectedCount = childPlaylistIds.filter(id => tempSelected.has(id)).length;
    const isAll = childPlaylistIds.length > 0 && selectedCount === childPlaylistIds.length;
    const isSome = selectedCount > 0 && selectedCount < childPlaylistIds.length;

    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            isAll
              ? 'bg-emerald-950/30 border-emerald-500/40 text-zinc-100'
              : isSome
              ? 'bg-emerald-950/15 border-emerald-500/20 text-zinc-200'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
          }`}
          style={{ paddingLeft: `${Math.max(10, level * 16)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => onToggleFolderCollapse(node.id)}
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              title={isCollapsed ? t('playlist.openFolder') : t('playlist.closeFolder')}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Folder Checkbox & Name */}
            <button
              type="button"
              onClick={() => onToggleNodeSelect(node)}
              className="flex items-center gap-2 cursor-pointer select-none text-left"
            >
              {isAll ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : isSome ? (
                <MinusSquare className="w-5 h-5 text-emerald-400/80 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-zinc-600 shrink-0" />
              )}

              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold truncate text-zinc-100">{node.name}</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-zinc-400 shrink-0 ml-2 bg-zinc-950/60 px-2 py-0.5 rounded-md border border-zinc-800/60">
            {t('playlist.activeCount', { selected: selectedCount, total: childPlaylistIds.length })}
          </span>
        </div>

        {/* Folder Children (Folders stay open automatically unless toggled) */}
        {!isCollapsed && node.children && node.children.length > 0 && (
          <div className="space-y-1 pl-2.5 border-l-2 border-amber-500/20 ml-3">
            {node.children.map(child => (
              <TreeNodeItem
                key={child.id}
                node={child}
                level={level + 1}
                tempSelected={tempSelected}
                collapsedFolderIds={collapsedFolderIds}
                onToggleFolderCollapse={onToggleFolderCollapse}
                onToggleNodeSelect={onToggleNodeSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Playlist Node
  const isChecked = node.playlistId ? tempSelected.has(node.playlistId) : false;

  return (
    <label
      onClick={() => onToggleNodeSelect(node)}
      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
        isChecked
          ? 'bg-emerald-950/20 border-emerald-500/40 text-zinc-100'
          : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300'
      }`}
      style={{ paddingLeft: `${Math.max(10, level * 16)}px` }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="shrink-0">
          {isChecked ? (
            <CheckSquare className="w-5 h-5 text-emerald-400" />
          ) : (
            <Square className="w-5 h-5 text-zinc-600" />
          )}
        </div>
        <ListMusic className="w-4 h-4 text-cyan-400 shrink-0" />
        <span className="text-xs font-semibold truncate">{node.name}</span>
      </div>

      <span className="text-[11px] font-medium text-zinc-500 shrink-0 ml-2">
        {node.trackCount || 0} {(node.trackCount === 1) ? t('playlist.track') : t('playlist.tracks')}
      </span>
    </label>
  );
};

export const PlaylistFilterModal: React.FC<PlaylistFilterModalProps> = ({
  isOpen,
  onClose,
  playlists,
  playlistTree,
  selectedPlaylistIds,
  onSaveFilter,
}) => {
  const { t } = useI18n();
  const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(selectedPlaylistIds));
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());
  const wasOpenRef = React.useRef(false);

  // All folders automatically start OPEN by keeping collapsedFolderIds empty
  // Only initialize tempSelected when modal transitions from closed to open
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setTempSelected(new Set(selectedPlaylistIds));
      setSearchQuery('');
      setCollapsedFolderIds(new Set()); // Empty set = all folders open automatically
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, selectedPlaylistIds]);

  const treeNodes = useMemo(() => getTreeNodes(playlists, playlistTree), [playlists, playlistTree]);

  const filteredTreeNodes = useMemo(() => {
    if (!searchQuery.trim()) return treeNodes;
    return treeNodes
      .map(node => filterTreeNode(node, searchQuery))
      .filter((node): node is PlaylistNode => node !== null);
  }, [treeNodes, searchQuery]);

  if (!isOpen) return null;

  const totalCount = playlists.length;
  const selectedCount = tempSelected.size;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setTempSelected(new Set());
    } else {
      setTempSelected(new Set(playlists.map(p => p.id)));
    }
  };

  const handleToggleFolderCollapse = (folderId: string) => {
    setCollapsedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleToggleNodeSelect = (node: PlaylistNode) => {
    if (node.type === 'playlist' && node.playlistId) {
      setTempSelected(prev => {
        const next = new Set(prev);
        if (next.has(node.playlistId!)) {
          next.delete(node.playlistId!);
        } else {
          next.add(node.playlistId!);
        }
        return next;
      });
    } else if (node.type === 'folder') {
      const childIds = getAllPlaylistIds(node);
      const selectedInFolder = childIds.filter(id => tempSelected.has(id)).length;
      const isFolderAll = childIds.length > 0 && selectedInFolder === childIds.length;

      setTempSelected(prev => {
        const next = new Set(prev);
        if (isFolderAll) {
          // Deselect all child playlists in this folder
          childIds.forEach(id => next.delete(id));
        } else {
          // Select all child playlists in this folder
          childIds.forEach(id => next.add(id));
        }
        return next;
      });
    }
  };

  const handleApply = () => {
    onSaveFilter(Array.from(tempSelected));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 leading-snug">{t('playlist.filterTitle')}</h2>
              <p className="text-xs text-zinc-400">
                {t('playlist.filterSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle & Search Bar */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800/80 space-y-3">
          {/* Master Checkbox Row */}
          <div className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
            <button
              type="button"
              onClick={handleToggleAll}
              className="flex items-center gap-3 text-sm font-bold text-zinc-100 hover:text-emerald-400 transition-colors cursor-pointer select-none"
            >
              {isAllSelected ? (
                <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : isSomeSelected ? (
                <MinusSquare className="w-5 h-5 text-emerald-400/80 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-zinc-500 shrink-0" />
              )}
              <span>{isAllSelected ? t('playlist.deselectAll') : t('playlist.selectAll')}</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t('playlist.activeCount', { selected: selectedCount, total: totalCount })}
            </span>
          </div>

          {/* Search Input for playlists/folders */}
          {playlists.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('playlist.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Tree List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {playlists.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs space-y-2">
              <Music className="w-8 h-8 mx-auto text-zinc-600" />
              <p>{t('playlist.noneInLibrary')}</p>
            </div>
          ) : filteredTreeNodes.length === 0 ? (
            <div className="py-8 text-center text-zinc-500 text-xs">
              {t('playlist.noneForQuery', { query: searchQuery })}
            </div>
          ) : (
            filteredTreeNodes.map(node => (
              <TreeNodeItem
                key={node.id}
                node={node}
                level={0}
                tempSelected={tempSelected}
                collapsedFolderIds={collapsedFolderIds}
                onToggleFolderCollapse={handleToggleFolderCollapse}
                onToggleNodeSelect={handleToggleNodeSelect}
              />
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:opacity-90 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{t('playlist.apply')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
