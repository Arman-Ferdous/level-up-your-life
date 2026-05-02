import { useEffect, useState } from "react";
import { AvatarAPI } from "../api/avatar.api";
import { useAuth } from "../context/AuthContext";
import styles from "./AvatarShop.module.css";

export default function AvatarShopPage() {
  const { user, syncUser } = useAuth();
  const [avatars, setAvatars] = useState([]);
  const [ownedAvatars, setOwnedAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingId, setBuyingId] = useState("");
  const [equipingId, setEquipingId] = useState("");

  async function loadAvatars() {
    setLoading(true);
    setError("");
    try {
      const [shopRes, myRes] = await Promise.all([
        AvatarAPI.getShop(),
        AvatarAPI.getMyAvatars()
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
    setBuyingId(avatarId);
    setError("");
    try {
      const res = await AvatarAPI.buy(avatarId);
      setOwnedAvatars(res.data.ownedAvatars);
      setSelectedAvatar(res.data.selectedAvatar);
      if (res.data.updatedUser || res.data.points) {
        syncUser({ ...user, points: res.data.points });
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to buy avatar");
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

  const groupedByCategory = {
    fruit: avatars.filter(a => a.category === "fruit"),
    flower: avatars.filter(a => a.category === "flower"),
    doll: avatars.filter(a => a.category === "doll"),
    car: avatars.filter(a => a.category === "car")
  };

  const isOwned = (avatarId) => ownedAvatars.some(a => a._id === avatarId);
  const isEquipped = (avatarId) => selectedAvatar?._id === avatarId;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Customize</p>
          <h1 className={styles.title}>Avatar Shop</h1>
          <p className={styles.description}>
            Collect and equip unique avatars to express yourself. Your current avatar shows next to your name.
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
        </div>
      </header>

      {error && <p className={styles.error}>{error}</p>}

      {loading ? (
        <p className={styles.loading}>Loading avatars...</p>
      ) : (
        <>
          {/* Fruits Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🍎 Fruits</h2>
            <p className={styles.sectionDesc}>5 points each</p>
            <div className={styles.grid}>
              {groupedByCategory.fruit.map(avatar => (
                <div key={avatar._id} className={styles.avatarCard}>
                  <div className={styles.avatarDisplay}>
                    <span className={styles.emoji}>{avatar.emoji}</span>
                  </div>
                  <h3 className={styles.name}>{avatar.name}</h3>
                  <p className={styles.desc}>{avatar.description}</p>
                  <div className={styles.cost}>{avatar.cost} pts</div>
                  {isOwned(avatar._id) ? (
                    <button
                      className={`${styles.btn} ${isEquipped(avatar._id) ? styles.equipped : styles.equip}`}
                      onClick={() => handleEquip(avatar._id)}
                      disabled={equipingId === avatar._id || isEquipped(avatar._id)}
                    >
                      {isEquipped(avatar._id) ? "✓ Equipped" : (equipingId === avatar._id ? "Equipping..." : "Equip")}
                    </button>
                  ) : (
                    <button
                      className={styles.btn}
                      onClick={() => handleBuy(avatar._id)}
                      disabled={buyingId === avatar._id || (user?.points || 0) < avatar.cost}
                    >
                      {buyingId === avatar._id ? "Buying..." : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Flowers Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🌻 Flowers</h2>
            <p className={styles.sectionDesc}>5 points each</p>
            <div className={styles.grid}>
              {groupedByCategory.flower.map(avatar => (
                <div key={avatar._id} className={styles.avatarCard}>
                  <div className={styles.avatarDisplay}>
                    <span className={styles.emoji}>{avatar.emoji}</span>
                  </div>
                  <h3 className={styles.name}>{avatar.name}</h3>
                  <p className={styles.desc}>{avatar.description}</p>
                  <div className={styles.cost}>{avatar.cost} pts</div>
                  {isOwned(avatar._id) ? (
                    <button
                      className={`${styles.btn} ${isEquipped(avatar._id) ? styles.equipped : styles.equip}`}
                      onClick={() => handleEquip(avatar._id)}
                      disabled={equipingId === avatar._id || isEquipped(avatar._id)}
                    >
                      {isEquipped(avatar._id) ? "✓ Equipped" : (equipingId === avatar._id ? "Equipping..." : "Equip")}
                    </button>
                  ) : (
                    <button
                      className={styles.btn}
                      onClick={() => handleBuy(avatar._id)}
                      disabled={buyingId === avatar._id || (user?.points || 0) < avatar.cost}
                    >
                      {buyingId === avatar._id ? "Buying..." : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Dolls Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🪆 Dolls & Friends</h2>
            <p className={styles.sectionDesc}>15 points each - Rare</p>
            <div className={styles.grid}>
              {groupedByCategory.doll.map(avatar => (
                <div key={avatar._id} className={`${styles.avatarCard} ${styles.rare}`}>
                  <div className={styles.rarity}>Rare</div>
                  <div className={styles.avatarDisplay}>
                    <span className={styles.emoji}>{avatar.emoji}</span>
                  </div>
                  <h3 className={styles.name}>{avatar.name}</h3>
                  <p className={styles.desc}>{avatar.description}</p>
                  <div className={styles.cost}>{avatar.cost} pts</div>
                  {isOwned(avatar._id) ? (
                    <button
                      className={`${styles.btn} ${isEquipped(avatar._id) ? styles.equipped : styles.equip}`}
                      onClick={() => handleEquip(avatar._id)}
                      disabled={equipingId === avatar._id || isEquipped(avatar._id)}
                    >
                      {isEquipped(avatar._id) ? "✓ Equipped" : (equipingId === avatar._id ? "Equipping..." : "Equip")}
                    </button>
                  ) : (
                    <button
                      className={styles.btn}
                      onClick={() => handleBuy(avatar._id)}
                      disabled={buyingId === avatar._id || (user?.points || 0) < avatar.cost}
                    >
                      {buyingId === avatar._id ? "Buying..." : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Cars Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>🚀 Vehicles</h2>
            <p className={styles.sectionDesc}>20-30 points - Epic & Legendary</p>
            <div className={styles.grid}>
              {groupedByCategory.car.map(avatar => (
                <div key={avatar._id} className={`${styles.avatarCard} ${avatar.rarity === "legendary" ? styles.legendary : styles.epic}`}>
                  <div className={styles.rarity}>{avatar.rarity}</div>
                  <div className={styles.avatarDisplay}>
                    <span className={styles.emoji}>{avatar.emoji}</span>
                  </div>
                  <h3 className={styles.name}>{avatar.name}</h3>
                  <p className={styles.desc}>{avatar.description}</p>
                  <div className={styles.cost}>{avatar.cost} pts</div>
                  {isOwned(avatar._id) ? (
                    <button
                      className={`${styles.btn} ${isEquipped(avatar._id) ? styles.equipped : styles.equip}`}
                      onClick={() => handleEquip(avatar._id)}
                      disabled={equipingId === avatar._id || isEquipped(avatar._id)}
                    >
                      {isEquipped(avatar._id) ? "✓ Equipped" : (equipingId === avatar._id ? "Equipping..." : "Equip")}
                    </button>
                  ) : (
                    <button
                      className={styles.btn}
                      onClick={() => handleBuy(avatar._id)}
                      disabled={buyingId === avatar._id || (user?.points || 0) < avatar.cost}
                    >
                      {buyingId === avatar._id ? "Buying..." : "Buy"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
