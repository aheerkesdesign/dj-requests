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
import { ModalShell } from './ModalShell';

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
              ? 'bg-primary/30 border-primary/40 text-foreground'
              : isSome
              ? 'bg-primary/15 border-primary/20 text-foreground'
              : 'bg-card/60 border-border/80 text-muted-foreground'
          }`}
          style={{ paddingLeft: `${Math.max(10, level * 16)}px` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => onToggleFolderCollapse(node.id)}
              className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title={isCollapsed ? t('playlist.openFolder') : t('playlist.closeFolder')}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Folder Checkbox & Name */}
            <button
              type="button"
              onClick={() => onToggleNodeSelect(node)}
              className="flex w-fit max-w-full items-center gap-2 cursor-pointer select-none text-left"
            >
              <span className="pointer-events-none inline-flex h-5 w-5 shrink-0 items-center justify-center">
                {isAll ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : isSome ? (
                  <MinusSquare className="h-5 w-5 text-primary/80" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </span>

              <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold truncate text-foreground">{node.name}</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-muted-foreground shrink-0 ml-2 bg-background/60 px-2 py-0.5 rounded-md border border-border/60">
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
      className={`motion-press flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
        isChecked
          ? 'bg-primary/20 border-primary/40 text-foreground'
          : 'bg-card/40 border-border/80 text-muted-foreground hover:border-border hover:text-foreground'
      }`}
      style={{ paddingLeft: `${Math.max(10, level * 16)}px` }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="pointer-events-none inline-flex h-5 w-5 shrink-0 items-center justify-center">
          {isChecked ? (
            <CheckSquare className="h-5 w-5 text-primary" />
          ) : (
            <Square className="h-5 w-5 text-muted-foreground" />
          )}
        </span>
        <ListMusic className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-semibold truncate">{node.name}</span>
      </div>

      <span className="text-[11px] font-medium text-muted-foreground shrink-0 ml-2">
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

  const totalCount = playlists.length;
  const selectedCount = tempSelected.size;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isSomeSelected = selectedCount > 0 && selectedCount < totalCount;

  const selectedTrackCount = useMemo(() => {
    const trackIds = new Set<string>();
    for (const playlist of playlists) {
      if (!tempSelected.has(playlist.id)) continue;
      for (const trackId of playlist.trackIds) {
        trackIds.add(trackId);
      }
    }
    return trackIds.size;
  }, [playlists, tempSelected]);

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
    <ModalShell
      open={isOpen}
      overlayTone="muted"
      panelClassName="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
    >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-snug">{t('playlist.filterTitle')}</h2>
              <p className="text-xs text-muted-foreground">
                {t('playlist.filterSubtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Toggle & Search Bar */}
        <div className="p-4 bg-background/60 border-b border-border/80 space-y-3">
          {/* Master Checkbox Row */}
          <div className="flex items-center justify-between bg-card/80 border border-border p-3 rounded-xl">
            <button
              type="button"
              onClick={handleToggleAll}
              className="flex w-fit max-w-full items-center gap-3 text-sm font-bold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
            >
              <span className="pointer-events-none inline-flex h-5 w-5 shrink-0 items-center justify-center">
                {isAllSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : isSomeSelected ? (
                  <MinusSquare className="h-5 w-5 text-primary/80" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </span>
              <span>{isAllSelected ? t('playlist.deselectAll') : t('playlist.selectAll')}</span>
            </button>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {t('playlist.activeCount', { selected: selectedCount, total: totalCount })}
            </span>
          </div>

          {/* Search Input for playlists/folders */}
          {playlists.length > 4 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('playlist.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40"
              />
            </div>
          )}
        </div>

        {/* Tree List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {playlists.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs space-y-2">
              <Music className="w-8 h-8 mx-auto text-muted-foreground" />
              <p>{t('playlist.noneInLibrary')}</p>
            </div>
          ) : filteredTreeNodes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
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
        <div className="px-5 py-3.5 border-t border-border bg-card/90 flex flex-wrap items-center justify-end gap-x-2.5 gap-y-2">
          <p className="min-w-max grow whitespace-nowrap text-xs font-medium text-muted-foreground">
            {t(
              selectedTrackCount === 1 ? 'playlist.selectedTrack' : 'playlist.selectedTracks',
              { count: selectedTrackCount }
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-foreground font-semibold text-xs transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-90"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{t('playlist.apply')}</span>
            </button>
          </div>
        </div>
    </ModalShell>
  );
};
