import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AvatarAPI } from "../api/avatar.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AvatarShop.module.css";

function AvatarCard({
  avatar,
  isOwned,
  isEquipped,
  onBuy,
  onEquip,
  buyingId,
  equipingId,
  userPoints,
  isPremium,
}) {
  const premiumLocked = avatar.isPremiumOnly && !isPremium;

  return (
    <div
      className={[
        styles.avatarCard,
        avatar.rarity === "rare" ? styles.rare : "",
        avatar.rarity === "epic" ? styles.epic : "",
        avatar.rarity === "legendary" ? styles.legendary : "",
        premiumLocked ? styles.premiumLocked : "",
      ].join(" ")}
    >
      {/* Rarity badge */}
      {avatar.rarity !== "common" && (
        <div className={styles.rarity}>{avatar.rarity}</div>
      )}

      {/* Premium badge */}
      {avatar.isPremiumOnly && (
        <div className={styles.premiumBadge}>👑 Premium</div>
      )}

      {/* Lock overlay for non-premium users */}
      {premiumLocked && (
        <div className={styles.lockOverlay}>
          <span className={styles.lockIcon}>🔒</span>
          <span className={styles.lockText}>Premium Only</span>
        </div>
      )}

      <div className={styles.avatarDisplay}>
        <span className={styles.emoji}>{avatar.emoji}</span>
      </div>

      <h3 className={styles.name}>{avatar.name}</h3>
      <p className={styles.desc}>{avatar.description}</p>
      <div className={styles.cost}>{avatar.cost} pts</div>

      {premiumLocked ? (
        <Link to="/subscription" className={styles.unlockBtn}>
          Upgrade to Unlock
        </Link>
      ) : isOwned ? (
        <button
          className={`${styles.btn} ${isEquipped ? styles.equipped : styles.equip}`}
          onClick={() => onEquip(avatar._id)}
          disabled={equipingId === avatar._id || isEquipped}
        >
          {isEquipped
            ? "✓ Equipped"
            : equipingId === avatar._id
              ? "Equipping..."
              : "Equip"}
        </button>
      ) : (
        <button
          className={styles.btn}
          onClick={() => onBuy(avatar._id)}
          disabled={buyingId === avatar._id || userPoints < avatar.cost}
        >
          {buyingId === avatar._id ? "Buying..." : "Buy"}
        </button>
      )}
    </div>
  );
}

export default function AvatarShopPage() {
  const { user, syncUser } = useAuth();
  const [avatars, setAvatars] = useState([]);
  const [ownedAvatars, setOwnedAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState("");
  const [equipingId, setEquipingId] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  async function loadAvatars() {
    setLoading(true);
    setError("");
    try {
      const [shopRes, myRes] = await Promise.all([
        AvatarAPI.getShop(),
        AvatarAPI.getMyAvatars(),
      ]);
      setAvatars(shopRes.data.avatars || []);
      setOwnedAvatars(myRes.data.ownedAvatars || []);
      setSelectedAvatar(myRes.data.selectedAvatar || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load avatars");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAvatars();
  }, []);

  async function handleBuy(avatarId) {
    const avatar = avatars.find((a) => a._id === avatarId);
    if (avatar?.isPremiumOnly && !user?.isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setBuyingId(avatarId);
    setError("");
    try {
      const res = await AvatarAPI.buy(avatarId);
      setOwnedAvatars(res.data.ownedAvatars);
      setSelectedAvatar(res.data.selectedAvatar);
      if (res.data.points != null) {
        syncUser({ ...user, points: res.data.points });
      }
    } catch (err) {
      if (err?.response?.data?.premiumRequired) {
        setShowPremiumModal(true);
      } else {
        setError(err?.response?.data?.message || "Failed to buy avatar");
      }
    } finally {
      setBuyingId("");
    }
  }

  async function handleEquip(avatarId) {
    setEquipingId(avatarId);
    setError("");
    try {
      const res = await AvatarAPI.equip(avatarId);
      setSelectedAvatar(res.data.selectedAvatar);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to equip avatar");
    } finally {
      setEquipingId("");
    }
  }

  const byCategory = (cat) => avatars.filter((a) => a.category === cat);
  const isOwned = (id) => ownedAvatars.some((a) => a._id === id);
  const isEquipped = (id) => selectedAvatar?._id === id;

  const cardProps = (avatar) => ({
    avatar,
    isOwned: isOwned(avatar._id),
    isEquipped: isEquipped(avatar._id),
    onBuy: handleBuy,
    onEquip: handleEquip,
    buyingId,
    equipingId,
    userPoints: user?.points ?? 0,
    isPremium: user?.isPremium ?? false,
  });

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Customize</p>
          <h1 className={styles.title}>Avatar Shop</h1>
          <p className={styles.description}>
            Collect and equip unique avatars to express yourself. Your current
            avatar shows next to your name.
          </p>
        </div>
        <div className={styles.userInfo}>
          <span className={styles.points}>💰 {user?.points ?? 0} pts</span>
          {selectedAvatar && (
            <div className={styles.currentAvatar}>
              <span className={styles.avatarEmoji}>{selectedAvatar.emoji}</span>
              <span className={styles.avatarName}>{selectedAvatar.name}</span>
            </div>
          )}
          {user?.isPremium ? (
            <span className={styles.premiumStatus}>👑 Premium Member</span>
          ) : (
            <Link to="/subscription" className={styles.upgradeBanner}>
              👑 Upgrade to Premium — unlock rare avatars!
            </Link>
          )}
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading avatars...</p>
      ) : (
        <>
          {/* ── Fruits (Free) ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadRow}>
              <div>
                <h2 className={styles.sectionTitle}>🍎 Fruits</h2>
                <p className={styles.sectionDesc}>
                  5 points each · Free for everyone
                </p>
              </div>
              <span className={styles.freeTag}>🆓 Free</span>
            </div>
            <div className={styles.grid}>
              {byCategory("fruit").map((a) => (
                <AvatarCard key={a._id} {...cardProps(a)} />
              ))}
            </div>
          </section>

          {/* ── Flowers (Free) ── */}
          <section className={styles.section}>
            <div className={styles.sectionHeadRow}>
              <div>
                <h2 className={styles.sectionTitle}>🌻 Flowers</h2>
                <p className={styles.sectionDesc}>
                  5 points each · Free for everyone
                </p>
              </div>
              <span className={styles.freeTag}>🆓 Free</span>
            </div>
            <div className={styles.grid}>
              {byCategory("flower").map((a) => (
                <AvatarCard key={a._id} {...cardProps(a)} />
              ))}
            </div>
          </section>

          {/* ── Dolls (Premium) ── */}
          <section className={`${styles.section} ${styles.premiumSection}`}>
            {!user?.isPremium && (
              <div className={styles.premiumSectionBanner}>
                <span className={styles.premiumSectionIcon}>👑</span>
                <div>
                  <p className={styles.premiumSectionTitle}>
                    Premium Exclusive
                  </p>
                  <p className={styles.premiumSectionSubtitle}>
                    Subscribe to unlock these rare avatars and more!
                  </p>
                </div>
                <Link to="/subscription" className={styles.premiumSectionCta}>
                  Upgrade Now
                </Link>
              </div>
            )}
            <div className={styles.sectionHeadRow}>
              <div>
                <h2 className={styles.sectionTitle}>🪆 Dolls & Friends</h2>
                <p className={styles.sectionDesc}>
                  15 points each · Rare · 👑 Premium subscribers only
                </p>
              </div>
              <span className={styles.premiumTag}>👑 Premium</span>
            </div>
            <div className={styles.grid}>
              {byCategory("doll").map((a) => (
                <AvatarCard key={a._id} {...cardProps(a)} />
              ))}
            </div>
          </section>

          {/* ── Vehicles (Premium) ── */}
          <section className={`${styles.section} ${styles.premiumSection}`}>
            {!user?.isPremium && (
              <div className={styles.premiumSectionBanner}>
                <span className={styles.premiumSectionIcon}>👑</span>
                <div>
                  <p className={styles.premiumSectionTitle}>
                    Premium Exclusive
                  </p>
                  <p className={styles.premiumSectionSubtitle}>
                    Epic & Legendary avatars — subscribers only.
                  </p>
                </div>
                <Link to="/subscription" className={styles.premiumSectionCta}>
                  Upgrade Now
                </Link>
              </div>
            )}
            <div className={styles.sectionHeadRow}>
              <div>
                <h2 className={styles.sectionTitle}>🚀 Vehicles</h2>
                <p className={styles.sectionDesc}>
                  20–30 points · Epic & Legendary · 👑 Premium subscribers only
                </p>
              </div>
              <span className={styles.premiumTag}>👑 Premium</span>
            </div>
            <div className={styles.grid}>
              {byCategory("car").map((a) => (
                <AvatarCard key={a._id} {...cardProps(a)} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── Premium Modal ── */}
      {showPremiumModal && (
        <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalEmoji}>👑</div>
            <div className={styles.modalTitle}>Premium Only Avatar</div>
            <p className={styles.modalText}>
              This avatar is exclusive to Premium subscribers. Upgrade your plan
              to unlock all rare, epic, and legendary avatars!
            </p>
            <div className={styles.modalActions}>
              <Link className={styles.modalPrimary} to="/subscription">
                Upgrade to Premium
              </Link>
              <button
                type="button"
                className={styles.modalSecondary}
                onClick={() => setShowPremiumModal(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
