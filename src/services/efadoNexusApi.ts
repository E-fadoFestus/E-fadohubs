import {
  db,
  auth,
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
} from '../firebase';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { getBackendUrl } from '../config/backend';
import { UserProfile } from '../types';
import { ReactionKey } from '../components/nexus/nexusTypes';

const actionLocks = new Set<string>();

function requireActiveUser(user: UserProfile | null | undefined): UserProfile {
  if (!user || !user.uid || user.uid === 'guest-preview' || !auth.currentUser) {
    throw new Error('Please sign in first so your message and posts can be saved.');
  }
  return user;
}

function getOwnerMeta(user: UserProfile) {
  const ownerName = user.displayName || user.email?.split('@')[0] || 'EFADO Member';
  return {
    userId: user.uid,
    authorId: user.uid,
    ownerName,
    authorName: ownerName,
    authorPhoto: user.photoURL || '',
    phone: (user as any).phone || (user as any).phoneNumber || '',
    hub: 'NEXUS',
  };
}

function acquireLock(key: string): boolean {
  if (actionLocks.has(key)) return false;
  actionLocks.add(key);
  return true;
}

function releaseLock(key: string) {
  actionLocks.delete(key);
}

export const efadoNexusApi = {
  feed: {
    async createPost(
      user: UserProfile,
      input: {
        content: string;
        category?: string;
        groupId?: string;
        media?: Array<{ type: 'image' | 'video' | 'audio' | 'file'; url: string; name?: string }>;
        poll?: { question: string; options: Array<{ label: string; votes: string[] }> };
        event?: { title: string; date: string; location: string };
      }
    ) {
      const active = requireActiveUser(user);
      const clean = (input.content || '').trim();
      if (clean.length < 2 && (!input.media || input.media.length === 0) && !input.poll && !input.event) {
        throw new Error('Please write something, pick a photo/video, or create a poll before publishing.');
      }

      const lockKey = `${active.uid}:createPost`;
      if (!acquireLock(lockKey)) {
        throw new Error('Publishing is already in progress. Please wait.');
      }

      try {
        try {
          const vRes = await fetch(getBackendUrl('/api/nexus/validate-post'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: active.uid, content: clean || 'Shared media post', kind: 'post' })
          });
          if (!vRes.ok) {
            const errJson = await vRes.json().catch(() => ({}));
            if (errJson?.message) throw new Error(errJson.message);
          }
        } catch (netErr: any) {
          if (netErr?.message?.includes('characters') || netErr?.message?.includes('sign in')) {
            throw netErr;
          }
        }

        const meta = getOwnerMeta(active);
        const docData: any = {
          ...meta,
          content: clean || (input.event ? `Event: ${input.event.title}` : input.poll ? input.poll.question : 'Shared update'),
          category: input.category || 'GENERAL',
          media: input.media || [],
          likes: [],
          reactions: {},
          savedBy: [],
          shares: 0,
          comments: [],
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString(),
        };
        if (input.groupId) docData.groupId = input.groupId;
        if (input.poll) docData.poll = input.poll;
        if (input.event) docData.event = input.event;

        const ref = await addDoc(collection(db, 'social_posts'), docData);
        return { id: ref.id };
      } catch (err: any) {
        console.error('[efadoNexusApi.feed.createPost]', err);
        throw new Error(err?.message?.includes('sign in') || err?.message?.includes('write') ? err.message : 'Not sent, please try again.');
      } finally {
        releaseLock(lockKey);
      }
    },

    async toggleLikePost(user: UserProfile, postId: string, currentlyLiked: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'social_posts', postId), {
          likes: currentlyLiked ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleLikePost]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async reactToPost(user: UserProfile, postId: string, reaction: ReactionKey, currentReactions: Record<string, string[]>) {
      const active = requireActiveUser(user);
      try {
        const next: Record<string, string[]> = {};
        for (const [k, uids] of Object.entries(currentReactions || {})) {
          next[k] = (Array.isArray(uids) ? uids : []).filter((u) => u !== active.uid);
        }
        const alreadySame = Array.isArray(currentReactions?.[reaction]) && currentReactions[reaction].includes(active.uid);
        if (!alreadySame) {
          next[reaction] = [...(next[reaction] || []), active.uid];
        }
        await updateDoc(doc(db, 'social_posts', postId), { reactions: next });
        return next;
      } catch (err) {
        console.error('[reactToPost]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async addComment(user: UserProfile, postId: string, text: string) {
      const active = requireActiveUser(user);
      const clean = text.trim();
      if (clean.length < 1 || clean.length > 1000) {
        throw new Error('Please write a comment before sending.');
      }
      try {
        const meta = getOwnerMeta(active);
        const commentObj = {
          id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          userId: meta.userId,
          authorId: meta.authorId,
          authorName: meta.ownerName,
          text: clean,
          createdAtIso: new Date().toISOString()
        };
        await updateDoc(doc(db, 'social_posts', postId), {
          comments: arrayUnion(commentObj)
        });
        return commentObj;
      } catch (err) {
        console.error('[addComment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async sharePost(postId: string) {
      try {
        await updateDoc(doc(db, 'social_posts', postId), {
          shares: increment(1)
        });
      } catch (err) {
        console.error('[sharePost]', err);
      }
    },

    async toggleSavePost(user: UserProfile, postId: string, currentlySaved: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'social_posts', postId), {
          savedBy: currentlySaved ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleSavePost]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async votePoll(user: UserProfile, postId: string, currentPoll: any, optionIndex: number) {
      const active = requireActiveUser(user);
      if (!currentPoll || !Array.isArray(currentPoll.options)) return;
      try {
        const updatedOptions = currentPoll.options.map((opt: any, idx: number) => {
          const votes = Array.isArray(opt.votes) ? opt.votes.filter((u: string) => u !== active.uid) : [];
          if (idx === optionIndex) votes.push(active.uid);
          return { ...opt, votes };
        });
        await updateDoc(doc(db, 'social_posts', postId), {
          poll: { ...currentPoll, options: updatedOptions }
        });
      } catch (err) {
        console.error('[votePoll]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async createGroup(user: UserProfile, name: string, description: string, category: string) {
      const active = requireActiveUser(user);
      const cleanName = name.trim();
      if (cleanName.length < 3) throw new Error('Group name must be at least 3 characters.');
      const slug = `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Date.now().toString(36).slice(-4)}`;
      try {
        const meta = getOwnerMeta(active);
        await setDoc(doc(db, 'gist_groups', slug), {
          id: slug,
          ...meta,
          name: cleanName,
          description: description.trim() || 'Community group on EFADO Gist World',
          category: category || 'Community',
          members: [active.uid],
          memberCount: 1,
          status: 'active',
          type: 'GROUP',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return slug;
      } catch (err) {
        console.error('[createGroup]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async joinGroup(user: UserProfile, groupId: string, isMember: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'gist_groups', groupId), {
          members: isMember ? arrayRemove(active.uid) : arrayUnion(active.uid),
          memberCount: increment(isMember ? -1 : 1)
        });
      } catch (err) {
        console.error('[joinGroup]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async createPage(user: UserProfile, title: string, category: string, bio: string) {
      const active = requireActiveUser(user);
      if (title.trim().length < 2) throw new Error('Please enter a page name.');
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_pages'), {
          ...meta,
          title: title.trim(),
          category: category.trim() || 'Business & Community',
          bio: bio.trim() || 'Official EFADO Gist World Page',
          followers: [active.uid],
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[createPage]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async toggleFollowPage(user: UserProfile, pageId: string, isFollowing: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'nexus_pages', pageId), {
          followers: isFollowing ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleFollowPage]', err);
        throw new Error('Not sent, please try again.');
      }
    }
  },

  stories: {
    async createStory(
      user: UserProfile,
      input: { caption: string; mediaUrl?: string; kind?: 'story' | 'highlight'; bgTone?: string }
    ) {
      const active = requireActiveUser(user);
      if (!input.caption.trim() && !input.mediaUrl) {
        throw new Error('Please write a story note or add a photo.');
      }
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_stories'), {
          ...meta,
          caption: input.caption.trim(),
          mediaUrl: input.mediaUrl || '',
          kind: input.kind || 'story',
          bgTone: input.bgTone || 'bg-indigo-100',
          views: 1,
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[createStory]', err);
        throw new Error('Not sent, please try again.');
      }
    }
  },

  connect: {
    async sendMessage(
      user: UserProfile,
      input: {
        roomId: string;
        content: string;
        msgType?: 'text' | 'voice' | 'file' | 'image' | 'broadcast' | 'status';
        mediaUrl?: string;
        fileName?: string;
        voiceDuration?: number;
        disappearing?: boolean;
      }
    ) {
      const active = requireActiveUser(user);
      const clean = (input.content || '').trim();
      if (!clean && !input.mediaUrl) {
        throw new Error('Please type a message or attach a file or voice note.');
      }
      const lockKey = `${active.uid}:sendMsg:${input.roomId}`;
      if (!acquireLock(lockKey)) return;
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'gist_chat_messages'), {
          ...meta,
          roomId: input.roomId,
          senderId: active.uid,
          senderName: meta.ownerName,
          senderPhoto: active.photoURL || '',
          content: clean || (input.fileName ? `Shared file: ${input.fileName}` : 'Voice note'),
          msgType: input.msgType || 'text',
          mediaUrl: input.mediaUrl || null,
          fileName: input.fileName || null,
          voiceDuration: input.voiceDuration || 0,
          disappearing: Boolean(input.disappearing),
          status: 'sent',
          timestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[connect.sendMessage]', err);
        throw new Error('Not sent, please try again.');
      } finally {
        releaseLock(lockKey);
      }
    },

    async startCallRoom(
      user: UserProfile,
      input: { title: string; callType: 'voice' | 'video' | 'live'; roomId?: string }
    ) {
      const active = requireActiveUser(user);
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'gist_live_rooms'), {
          ...meta,
          hostId: active.uid,
          hostName: meta.ownerName,
          title: input.title.trim() || `${meta.ownerName} Call Room`,
          callType: input.callType,
          roomId: input.roomId || 'general',
          participants: [active.uid],
          status: 'live',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[startCallRoom]', err);
        throw new Error('Could not start room. Please try again.');
      }
    },

    async endCallRoom(roomId: string) {
      try {
        await updateDoc(doc(db, 'gist_live_rooms', roomId), {
          status: 'ended',
          endedAt: serverTimestamp()
        });
      } catch (err) {
        console.error('[endCallRoom]', err);
      }
    }
  },

  vibes: {
    async publishVibe(
      user: UserProfile,
      input: { caption: string; videoUrl: string; soundTitle?: string; filterName?: string; duetFrom?: string }
    ) {
      const active = requireActiveUser(user);
      if (!input.videoUrl) throw new Error('Please upload or choose a short video.');
      const lockKey = `${active.uid}:publishVibe`;
      if (!acquireLock(lockKey)) throw new Error('Upload already in progress.');
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'reels'), {
          ...meta,
          videoUrl: input.videoUrl,
          caption: input.caption.trim() || 'EFADO Vibes Short Video',
          soundTitle: input.soundTitle || 'Original EFADO Sound',
          filterName: input.filterName || 'Natural Bright',
          duetFrom: input.duetFrom || '',
          likes: [],
          comments: [],
          shares: 0,
          views: 1,
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[publishVibe]', err);
        throw new Error('Not sent, please try again.');
      } finally {
        releaseLock(lockKey);
      }
    },

    async toggleLikeVibe(user: UserProfile, reelId: string, currentlyLiked: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'reels', reelId), {
          likes: currentlyLiked ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleLikeVibe]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async addVibeComment(user: UserProfile, reelId: string, text: string) {
      const active = requireActiveUser(user);
      if (!text.trim()) throw new Error('Please enter a comment.');
      try {
        const meta = getOwnerMeta(active);
        await updateDoc(doc(db, 'reels', reelId), {
          comments: arrayUnion({
            id: `vc_${Date.now()}`,
            userId: meta.userId,
            user: meta.ownerName,
            text: text.trim(),
            createdAtIso: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('[addVibeComment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async shareVibe(reelId: string) {
      try {
        await updateDoc(doc(db, 'reels', reelId), { shares: increment(1) });
      } catch (err) {
        console.error('[shareVibe]', err);
      }
    }
  },

  moments: {
    async createMoment(
      user: UserProfile,
      input: { caption: string; photoUrl: string; audience: 'public' | 'close_friends' | 'archive'; highlightTitle?: string }
    ) {
      const active = requireActiveUser(user);
      if (!input.photoUrl) throw new Error('Please add a clear photo for your Moment.');
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_moments'), {
          ...meta,
          caption: input.caption.trim() || 'EFADO Moment',
          photoUrl: input.photoUrl,
          audience: input.audience,
          highlightTitle: input.highlightTitle || '',
          likes: [],
          savedBy: [],
          comments: [],
          status: input.audience === 'archive' ? 'archived' : 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[createMoment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async toggleLikeMoment(user: UserProfile, momentId: string, liked: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'nexus_moments', momentId), {
          likes: liked ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleLikeMoment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async toggleSaveMoment(user: UserProfile, momentId: string, saved: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'nexus_moments', momentId), {
          savedBy: saved ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleSaveMoment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async addMomentComment(user: UserProfile, momentId: string, text: string) {
      const active = requireActiveUser(user);
      if (!text.trim()) throw new Error('Please write a comment.');
      try {
        const meta = getOwnerMeta(active);
        await updateDoc(doc(db, 'nexus_moments', momentId), {
          comments: arrayUnion({
            id: `mc_${Date.now()}`,
            userId: meta.userId,
            authorName: meta.ownerName,
            text: text.trim(),
            createdAtIso: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('[addMomentComment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async toggleCloseFriend(user: UserProfile, targetNameOrUid: string, isClose: boolean) {
      const active = requireActiveUser(user);
      try {
        await setDoc(
          doc(db, 'users', active.uid),
          {
            closeFriends: isClose ? arrayRemove(targetNameOrUid) : arrayUnion(targetNameOrUid)
          },
          { merge: true }
        );
      } catch (err) {
        console.error('[toggleCloseFriend]', err);
        throw new Error('Not sent, please try again.');
      }
    }
  },

  assembly: {
    async createChannel(
      user: UserProfile,
      input: { name: string; description: string; kind: 'channel' | 'group' | 'broadcast'; maxMembers: number }
    ) {
      const active = requireActiveUser(user);
      if (input.name.trim().length < 3) throw new Error('Channel name must be at least 3 characters.');
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'gist_communities'), {
          ...meta,
          name: input.name.trim(),
          description: input.description.trim() || 'Public EFADO Assembly Space',
          kind: input.kind,
          maxMembers: Math.max(100, Math.min(200000, Number(input.maxMembers || 200000))),
          members: [active.uid],
          memberCount: 1,
          slowModeSeconds: 0,
          autoResponder: 'Welcome to the channel! Please read pinned updates first.',
          pinnedMessage: '',
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[assembly.createChannel]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async postChannelMessage(
      user: UserProfile,
      input: {
        channelId: string;
        content: string;
        msgKind?: 'announcement' | 'message' | 'poll' | 'file' | 'assistant';
        fileName?: string;
        fileUrl?: string;
        poll?: { question: string; options: Array<{ label: string; votes: string[] }> };
      }
    ) {
      const active = requireActiveUser(user);
      const clean = (input.content || '').trim();
      if (!clean && !input.poll && !input.fileUrl) {
        throw new Error('Please write an update or attach a file or poll.');
      }
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_assembly_messages'), {
          ...meta,
          channelId: input.channelId,
          content: clean || (input.poll ? input.poll.question : `File: ${input.fileName}`),
          msgKind: input.msgKind || 'message',
          fileName: input.fileName || null,
          fileUrl: input.fileUrl || null,
          poll: input.poll || null,
          pinned: false,
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[assembly.postChannelMessage]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async voteChannelPoll(user: UserProfile, msgId: string, currentPoll: any, optionIndex: number) {
      const active = requireActiveUser(user);
      if (!currentPoll || !Array.isArray(currentPoll.options)) return;
      try {
        const nextOptions = currentPoll.options.map((o: any, i: number) => {
          const votes = Array.isArray(o.votes) ? o.votes.filter((u: string) => u !== active.uid) : [];
          if (i === optionIndex) votes.push(active.uid);
          return { ...o, votes };
        });
        await updateDoc(doc(db, 'nexus_assembly_messages', msgId), {
          poll: { ...currentPoll, options: nextOptions }
        });
      } catch (err) {
        console.error('[voteChannelPoll]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async pinMessage(channelId: string, msgId: string, content: string) {
      try {
        await updateDoc(doc(db, 'nexus_assembly_messages', msgId), { pinned: true });
        await updateDoc(doc(db, 'gist_communities', channelId), { pinnedMessage: content.slice(0, 280) });
      } catch (err) {
        console.error('[pinMessage]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async updateChannelSettings(channelId: string, settings: { slowModeSeconds?: number; autoResponder?: string }) {
      try {
        await updateDoc(doc(db, 'gist_communities', channelId), settings);
      } catch (err) {
        console.error('[updateChannelSettings]', err);
        throw new Error('Not sent, please try again.');
      }
    }
  },

  mindPro: {
    async askEfadoAi(input: {
      mode: 'write_gist' | 'reply_chat' | 'create_advert' | 'plan_business' | 'reason_partner';
      prompt: string;
      userName: string;
      faculty?: string;
    }) {
      const clean = input.prompt.trim();
      if (clean.length < 2) throw new Error('Please write your question or topic first.');
      const res = await fetch(getBackendUrl('/api/nexus/mind-pro/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: input.mode,
          prompt: clean,
          userName: input.userName || 'Member',
          faculty: input.faculty
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json?.reply) {
        throw new Error(json?.message || 'Not sent, please try again.');
      }
      return String(json.reply);
    },

    async verifyVoiceMark(user: UserProfile, audioDurationSec: number, phrase: string, audioUrl?: string) {
      const active = requireActiveUser(user);
      const res = await fetch(getBackendUrl('/api/nexus/voice-verify'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: active.uid,
          audioDurationSec,
          phrase
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Could not verify Voice Mark. Please try again.');
      }
      const meta = getOwnerMeta(active);
      await addDoc(collection(db, 'nexus_mind_pro_entries'), {
        ...meta,
        section: 'voice_mark',
        faculty: 'Voice Mark',
        title: `Voice Signature (${json.voiceMarkCode})`,
        content: phrase.trim() || 'EFADO Voice Mark Registered',
        audioUrl: audioUrl || '',
        voiceMarkCode: json.voiceMarkCode,
        likes: [],
        comments: [],
        status: 'verified',
        createdAt: serverTimestamp(),
        createdAtIso: new Date().toISOString()
      });
      return json;
    },

    async createFacultyEntry(
      user: UserProfile,
      input: {
        faculty: 'Reason' | 'Logic' | 'Truth' | 'Wisdom' | 'Debate' | 'Ideas';
        title: string;
        content: string;
      }
    ) {
      const active = requireActiveUser(user);
      if (input.title.trim().length < 3 || input.content.trim().length < 5) {
        throw new Error('Please write a clear title and thoughtful note.');
      }
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_mind_pro_entries'), {
          ...meta,
          section: 'faculty',
          faculty: input.faculty,
          title: input.title.trim(),
          content: input.content.trim(),
          likes: [],
          comments: [],
          status: 'active',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[createFacultyEntry]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async toggleLikeEntry(user: UserProfile, entryId: string, liked: boolean) {
      const active = requireActiveUser(user);
      try {
        await updateDoc(doc(db, 'nexus_mind_pro_entries', entryId), {
          likes: liked ? arrayRemove(active.uid) : arrayUnion(active.uid)
        });
      } catch (err) {
        console.error('[toggleLikeEntry]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async addEntryComment(user: UserProfile, entryId: string, text: string) {
      const active = requireActiveUser(user);
      if (!text.trim()) throw new Error('Please write your response first.');
      try {
        const meta = getOwnerMeta(active);
        await updateDoc(doc(db, 'nexus_mind_pro_entries', entryId), {
          comments: arrayUnion({
            id: `mp_${Date.now()}`,
            userId: meta.userId,
            authorName: meta.ownerName,
            text: text.trim(),
            createdAtIso: new Date().toISOString()
          })
        });
      } catch (err) {
        console.error('[addEntryComment]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async saveMindTechNote(
      user: UserProfile,
      input: { title: string; note: string; focusMinutes?: number; memoryScore?: number }
    ) {
      const active = requireActiveUser(user);
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'nexus_mind_pro_sessions'), {
          ...meta,
          title: input.title.trim() || 'Mind Pro Focus Session',
          note: input.note.trim() || 'Completed study and clarity drill.',
          focusMinutes: Number(input.focusMinutes || 0),
          memoryScore: Number(input.memoryScore || 0),
          status: 'completed',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[saveMindTechNote]', err);
        throw new Error('Not sent, please try again.');
      }
    },

    async sendHumanChatMessage(
      user: UserProfile,
      input: { topic: 'Human Support' | 'Mentor Guidance' | 'Verified Expert' | 'Real Friend Chat'; message: string }
    ) {
      const active = requireActiveUser(user);
      if (input.message.trim().length < 3) {
        throw new Error('Please write what you want to discuss with a real person.');
      }
      try {
        const meta = getOwnerMeta(active);
        const ref = await addDoc(collection(db, 'help_inbox'), {
          userId: meta.userId,
          userEmail: active.email || '',
          userName: meta.ownerName,
          phone: meta.phone || 'Not provided',
          hub: `EFADO Mind Pro (${input.topic})`,
          subject: 'Other',
          message: `[${input.topic}] ${input.message.trim()}`,
          status: 'New',
          createdAt: serverTimestamp(),
          createdAtIso: new Date().toISOString()
        });
        return ref.id;
      } catch (err) {
        console.error('[sendHumanChatMessage]', err);
        throw new Error('Not sent, please try again.');
      }
    }
  },

  notifications: {
    async markAsRead(notificationId: string) {
      try {
        await updateDoc(doc(db, 'efado_notifications', notificationId), { isRead: true });
      } catch {}
    },
    async deleteItem(collectionName: string, docId: string) {
      await deleteDoc(doc(db, collectionName, docId));
    }
  }
};
