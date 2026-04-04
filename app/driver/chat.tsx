import { supabase } from "@/SupaBase/supabase_file";
import { useEffect, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

export default function Chat({ deliveryId }: any) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    load();

    const sub = supabase.channel("chat").on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      load
    ).subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const load = async () => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("delivery_id", deliveryId);

    setMsgs(data || []);
  };

  const send = async () => {
    const user = (await supabase.auth.getUser()).data.user;

    await supabase.from("messages").insert([
      { delivery_id: deliveryId, sender_id: user?.id, message: text },
    ]);

    setText("");
  };

  return (
    <View>
      {msgs.map((m) => <Text key={m.id}>{m.message}</Text>)}
      <TextInput value={text} onChangeText={setText} />
      <Button title="Send" onPress={send} />
    </View>
  );
}