import mongoose from "mongoose";
import { Room } from "../model/room";
import { Database } from "./mongodb";

export class RoomRepository {
  database: Database;
  collectionName: string;
  collection!: mongoose.Collection;

  constructor(database: Database, collectionName?: string) {
    this.database = database;
    this.collectionName = process.env.ROOM_COLLECTION_NAME ?? collectionName ?? 'rooms';
    this.setCollection();
  }

  setCollection() {
    this.collection = this.database.connection.collection(this.collectionName);
  }

  async saveRoom(room: Room) {
    if (this.collection) return await this.collection.insertOne(room);
    throw new Error("Collection not configured");
  }

  async list() {
    if (this.collection) return await this.collection.find().toArray();
    throw new Error("Collection not configured");
  }

  async delete(id: string) {
    if (this.collection) return await this.collection.deleteOne({
      _id: new mongoose.Types.ObjectId(id || '')
    });
    throw new Error("Collection not configured");
  }

  async get(id: string) {
    if (this.collection) return await this.collection.findOne({
      _id: new mongoose.Types.ObjectId(id || '')
    });
    throw new Error("Collection not configured");
  }
}